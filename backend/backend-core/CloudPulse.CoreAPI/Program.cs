using CloudPulse.CoreAPI.Data;
using Microsoft.EntityFrameworkCore;
using Neo4j.Driver;
using OpenTelemetry.Exporter;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Prometheus;

var builder = WebApplication.CreateBuilder(args);

// =========================================================================
// 🎛️ INJEÇÃO DINÂMICA DE CONFIGURAÇÕES DE INFRAESTRUTURA (SUPORTE A IaC)
// =========================================================================

var postgresConnectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

var neo4jUri = Environment.GetEnvironmentVariable("Neo4j__Uri")
    ?? builder.Configuration["Neo4j:Uri"] ?? "bolt://localhost:7687";

var neo4jUsername = Environment.GetEnvironmentVariable("Neo4j__Username")
    ?? builder.Configuration["Neo4j:Username"] ?? "neo4j";

var neo4jPassword = Environment.GetEnvironmentVariable("Neo4j__Password")
    ?? builder.Configuration["Neo4j:Password"] ?? "cloudpulse_password";

var otlpEndpoint = Environment.GetEnvironmentVariable("OTEL_EXPORTER_OTLP_ENDPOINT")
    ?? "http://otel-collector.monitoring.svc.cluster.local:4318";

// =========================================================================
// 🔌 CONFIGURAÇÃO DOS SERVIÇOS (CONTAINER DE INJEÇÃO DE DEPENDÊNCIA)
// =========================================================================

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(postgresConnectionString));

// Injeta o Driver nativo do Neo4j para mapeamento de grafos
builder.Services.AddSingleton<IDriver>(GraphDatabase.Driver(
    neo4jUri,
    AuthTokens.Basic(neo4jUsername, neo4jPassword)
));

// =========================================================================
// 🔭 OPENTELEMETRY — TRACING DISTRIBUÍDO
// =========================================================================
// Métricas Prometheus continuam via prometheus-net (/metrics na porta 5223).
// OTel é responsável pelos traces (spans) enviados ao Collector via OTLP/HTTP.

builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource
        .AddService(
            serviceName: "cloudpulse-core-api",
            serviceVersion: typeof(Program).Assembly.GetName().Version?.ToString() ?? "1.0.0")
        .AddAttributes(new Dictionary<string, object>
        {
            ["deployment.environment"] = builder.Environment.EnvironmentName.ToLowerInvariant()
        }))
    .WithTracing(tracing => tracing
        .AddAspNetCoreInstrumentation(opts =>
        {
            opts.RecordException = true;
            opts.Filter = ctx => ctx.Request.Path != "/metrics";
        })
        .AddHttpClientInstrumentation()
        .AddSource("CloudPulse.CoreAPI.Tasks")
        .AddOtlpExporter(opt =>
        {
            opt.Endpoint = new Uri(otlpEndpoint);
            opt.Protocol = OtlpExportProtocol.HttpProtobuf;
        }));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// =========================================================================
// 🛣️ PIPELINE DE REQUISIÇÕES HTTP (MIDDLEWARES)
// =========================================================================

// Observabilidade: deve ficar no topo do pipeline para capturar todas as rotas.
// UseHttpMetrics coleta duração, tamanho e status de cada request HTTP.
// UseMetricServer expõe o endpoint /metrics na porta 5223 para o Prometheus.
app.UseHttpMetrics();
app.UseMetricServer();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "CloudPulse Core API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

// =========================================================================
// 🕸️ CHEFÃO: ROTA DE TOPOLOGIA SRE (NEO4J PARA REACT FLOW)
// =========================================================================
app.MapGet("/api/Topology", async (IDriver driver) =>
{
    try
    {
        await using var session = driver.AsyncSession();
        
        // A Cypher Query que mapeia toda a arquitetura
        var query = @"
            MATCH (s:Service)
            OPTIONAL MATCH (s)-[r:DEPENDS_ON]->(target:Service)
            RETURN 
                collect(DISTINCT { id: toString(s.id), name: s.name, env: s.environment }) as nodes,
                collect(DISTINCT { source: toString(s.id), target: toString(target.id) }) as edges";

        var result = await session.RunAsync(query);
        var record = await result.SingleAsync();

        // Extração segura do JSON retornado pelo Neo4j
        var nodesDict = record["nodes"].As<IReadOnlyList<IReadOnlyDictionary<string, object>>>();
        var edgesDict = record["edges"].As<IReadOnlyList<IReadOnlyDictionary<string, object>>>();

        // Formatando a matriz de nós (Microsserviços)
        var reactNodes = nodesDict.Select((n, index) => new
        {
            id = n["id"]?.ToString(),
            position = new { x = 250 * (index % 3), y = 150 * (index / 3) },
            data = new { label = n["name"]?.ToString() },
            style = new
            {
                background = "#1e1e1e",
                color = n["env"]?.ToString() == "Production" ? "#4caf50" : "#61dafb",
                border = n["env"]?.ToString() == "Production" ? "2px solid #4caf50" : "1px solid #61dafb",
                borderRadius = "8px",
                padding = "15px",
                fontWeight = "bold"
            }
        });

        // Formatando a matriz de arestas (Dependências Animadas)
        var reactEdges = edgesDict
            .Where(e => e.ContainsKey("target") && e["target"] != null)
            .Select(e => new
            {
                id = $"e_{e["source"]}_{e["target"]}",
                source = e["source"]?.ToString(),
                target = e["target"]?.ToString(),
                animated = true,
                style = new { stroke = "#888", strokeWidth = 2 }
            });

        return Results.Ok(new { nodes = reactNodes, edges = reactEdges });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[ERRO NEO4J] {ex.Message}");
        return Results.Problem("Erro ao comunicar com o cluster de Grafos.");
    }
});

// =========================================================================
// 🚀 INICIALIZAÇÃO DA APLICAÇÃO E MIGRAÇÕES AUTOMÁTICAS
// =========================================================================

try
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Console.WriteLine("[INFO] Verificando conexões de infraestrutura e aplicando Migrations no PostgreSQL...");
        db.Database.Migrate();
        Console.WriteLine("[INFO] Banco de dados PostgreSQL sincronizado com sucesso.");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"[WARN] Falha na migração: {ex.Message}");
}

app.Run();
