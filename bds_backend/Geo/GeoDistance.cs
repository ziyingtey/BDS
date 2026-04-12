namespace bds_backend.Geo;

public static class GeoDistance
{
    /// <summary>Great-circle distance in kilometres (Haversine).</summary>
    public static double HaversineKm(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371.0;
        var dLat = (lat2 - lat1) * (Math.PI / 180.0);
        var dLon = (lon2 - lon1) * (Math.PI / 180.0);
        var a =
            Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
            Math.Cos(lat1 * (Math.PI / 180.0)) *
            Math.Cos(lat2 * (Math.PI / 180.0)) *
            Math.Sin(dLon / 2) *
            Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }
}
