using System.Net.Http.Json;
using System.Text.Json;
using bds_backend.Dtos;

namespace bds_backend.Services;

/// <summary>
/// Proxies to Python FastAPI (sklearn joblib). Falls back to a simple formula if ML service is down.
/// </summary>
public class WaitPredictionService(
    IHttpClientFactory httpClientFactory,
    IConfiguration config,
    ILogger<WaitPredictionService> logger)
{
    private readonly string? _pythonUrl = config["WaitPrediction:PythonServiceUrl"];

    public async Task<PredictWaitResponse> PredictAsync(PredictWaitRequest req, CancellationToken ct = default)
    {
        if (req.QueueLength <= 0)
        {
            return new PredictWaitResponse { WaitMinutes = 0, Source = "logic" };
        }

        if (!string.IsNullOrWhiteSpace(_pythonUrl))
        {
            try
            {
                var client = httpClientFactory.CreateClient("WaitPrediction");
                var url = $"{_pythonUrl.TrimEnd('/')}/predict/wait";
                var res = await client.PostAsJsonAsync(url, req, ct);

                if (res.IsSuccessStatusCode)
                {
                    await using var stream = await res.Content.ReadAsStreamAsync(ct);
                    var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
                    var root = doc.RootElement;
                    if (root.TryGetProperty("waitMinutes", out var wm))
                    {
                        return new PredictWaitResponse
                        {
                            WaitMinutes = wm.GetDouble(),
                            Source = root.TryGetProperty("source", out var s) ? s.GetString() ?? "sklearn" : "sklearn"
                        };
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "ML wait service unavailable; using fallback.");
            }
        }

        return new PredictWaitResponse
        {
            WaitMinutes = FallbackMinutes(req),
            Source = "fallback"
        };
    }

    private static double FallbackMinutes(PredictWaitRequest req)
    {
        var load = (req.QueueLength + 1.0) / Math.Max(1, req.CountersOpen);
        var baseM = req.ServiceType.Contains("Wealth", StringComparison.OrdinalIgnoreCase) ? 32.0
            : req.ServiceType.Contains("Card", StringComparison.OrdinalIgnoreCase) ? 17.0
            : 11.0;
        var m = load * baseM * 0.12 + 8.0;
        return Math.Clamp(m, 5.0, 180.0);
    }
}
