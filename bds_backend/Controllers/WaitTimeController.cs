using bds_backend.Dtos;
using bds_backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace bds_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WaitTimeController(WaitPredictionService waitPrediction) : ControllerBase
{
    /// <summary>
    /// Predict estimated wait (minutes) using trained sklearn model via Python service, or heuristic fallback.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("predict")]
    public async Task<ActionResult<PredictWaitResponse>> Predict([FromBody] PredictWaitRequest request)
    {
        if (request.QueueLength < 0 || request.CountersOpen < 1)
            return BadRequest();
        var result = await waitPrediction.PredictAsync(request);
        return Ok(result);
    }
}
