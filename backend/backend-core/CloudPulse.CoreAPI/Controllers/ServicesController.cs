using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CloudPulse.CoreAPI.Data;
using CloudPulse.CoreAPI.Entities;
using Neo4j.Driver;
using System;
using System.Threading.Tasks;

namespace CloudPulse.CoreAPI.Controllers
{
    // Classe auxiliar para receber o payload de relacionamento
    public class ServiceDependencyRequest
    {
        public string SourceId { get; set; } = string.Empty;   // Ex: ID do API Gateway
        public string TargetId { get; set; } = string.Empty;   // Ex: ID do Order Service
    }

    [ApiController]
    [Route("api/[controller]")]
    public class ServicesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IDriver _graphDriver;

        public ServicesController(AppDbContext context, IDriver graphDriver)
        {
            _context = context;
            _graphDriver = graphDriver;
        }

        // GET: api/services
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var services = await _context.Services.ToListAsync();
            return Ok(services);
        }

        // POST: api/services
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ServiceEntity service)
        {
            if (service.Id == Guid.Empty)
            {
                service.Id = Guid.NewGuid();
            }
            
            // 1. Salva no Banco Relacional (PostgreSQL)
            _context.Services.Add(service);
            await _context.SaveChangesAsync();

            // 2. Sincroniza o Nó com o Banco de Grafos (Neo4j)
            var cypherQuery = @"
                MERGE (s:Service { id: $id })
                ON CREATE SET s.name = $name, 
                              s.environment = $environment, 
                              s.language = $language, 
                              s.status = $status";

            using (var session = _graphDriver.AsyncSession())
            {
                await session.ExecuteWriteAsync(async tx =>
                {
                    await tx.RunAsync(cypherQuery, new {
                        id = service.Id.ToString().ToLower(),
                        name = service.Name,
                        environment = service.Environment,
                        language = service.Language,
                        status = service.Status
                    });
                });
            }

            return CreatedAtAction(nameof(GetAll), new { id = service.Id }, service);
        }

        // =========================================================================
        // 🔨 FRENTE C: Criação de Relacionamentos de Topologia (DEPENDS_ON)
        // =========================================================================
        [HttpPost("connect")]
        public async Task<IActionResult> ConnectServices([FromBody] ServiceDependencyRequest request)
        {
            // Query Cypher que busca os dois nós pelos IDs e cria a seta de dependência entre eles
            var cypherRelationQuery = @"
                MATCH (source:Service { id: $sourceId })
                MATCH (target:Service { id: $targetId })
                MERGE (source)-[r:DEPENDS_ON]->(target)
                RETURN type(r)";

            try {
                using (var session = _graphDriver.AsyncSession())
                {
                    var result = await session.ExecuteWriteAsync(async tx =>
                    {
                        var cursor = await tx.RunAsync(cypherRelationQuery, new {
                            sourceId = request.SourceId.ToLower(),
                            targetId = request.TargetId.ToLower()
                        });
                        return await cursor.FetchAsync();
                    });

                    if (!result)
                    {
                        return BadRequest("Não foi possível criar o relacionamento. Verifique se os dois IDs realmente existem no Neo4j.");
                    }
                }

                return Ok(new { success = true, message = $"Topological link established: {request.SourceId} DEPENDS_ON {request.TargetId}" });
            }
            catch (Exception ex) {
                return StatusCode(500, $"Graph database persistent failure: {ex.Message}");
            }
        }
    }
}
