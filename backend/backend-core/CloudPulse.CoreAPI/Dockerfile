# STAGE 1: Compilação e Build do C#
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-env
WORKDIR /src

# Copia o arquivo de projeto e restaura as dependências do NuGet
COPY *.csproj ./
RUN dotnet restore

# Copia o resto dos arquivos do código fonte e compila o binário de produção
COPY . ./
RUN dotnet publish -c Release -o /app/out

# STAGE 2: Imagem de execução com Datadog APM + Prometheus
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

# =========================================================================
# DATADOG .NET APM — Instrumentação automática via CLR Profiler
# Para atualizar a versão: https://github.com/DataDog/dd-trace-dotnet/releases
# =========================================================================
ARG DD_TRACER_VERSION=3.3.1
RUN apt-get update \
    && apt-get install -y --no-install-recommends wget \
    && wget -q -O /tmp/datadog-dotnet-apm.deb \
       "https://github.com/DataDog/dd-trace-dotnet/releases/download/v${DD_TRACER_VERSION}/datadog-dotnet-apm_${DD_TRACER_VERSION}_amd64.deb" \
    && dpkg -i /tmp/datadog-dotnet-apm.deb \
    && rm /tmp/datadog-dotnet-apm.deb \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build-env /app/out .

# Ativa o profiler CLR do Datadog (obrigatório para APM automático)
ENV CORECLR_ENABLE_PROFILING=1
ENV CORECLR_PROFILER={846F5F1C-F9AE-4B07-969E-05C26BC060D8}
ENV CORECLR_PROFILER_PATH=/opt/datadog/Datadog.Trace.ClrProfiler.Native.so
ENV DD_DOTNET_TRACER_HOME=/opt/datadog

# Identificação do serviço no Datadog — sobrescreva via Terraform ou docker run
ENV DD_SERVICE=cloudpulse-core-api
ENV DD_ENV=development
ENV DD_VERSION=1.0.0
# DD_AGENT_HOST deve ser injetado pelo Terraform (nome do container do Datadog Agent)

# Expõe a porta do Kestrel. /metrics fica em :5223/metrics (mesmo servidor)
EXPOSE 5223
ENV ASPNETCORE_URLS=http://+:5223

ENTRYPOINT ["dotnet", "CloudPulse.CoreAPI.dll"]
