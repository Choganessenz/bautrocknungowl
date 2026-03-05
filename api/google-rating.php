<?php
/**
 * Google Places Rating Proxy
 *
 * Setup:
 *   1. Google Cloud Console → Places API (Legacy) aktivieren
 *   2. API-Key erstellen, auf diese Domain beschränken
 *   3. Place ID ermitteln: https://developers.google.com/maps/documentation/places/web-service/place-id
 *   4. Die beiden Konstanten unten eintragen
 *
 * Der Browser ruft dieses Script auf – der API-Key bleibt serverseitig.
 * Ergebnis wird 24 h in google-rating.json gecacht; kein Cron-Job nötig.
 */

define('GOOGLE_API_KEY', 'DEIN_API_KEY_HIER');   // TODO: echten Key eintragen
define('GOOGLE_PLACE_ID', 'DEINE_PLACE_ID_HIER'); // TODO: echte Place ID eintragen
define('CACHE_FILE', __DIR__ . '/../google-rating.json');
define('CACHE_TTL', 86400); // 24 Stunden

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=3600');

/* ── Cache prüfen ─────────────────────────────────────────────────────────── */
if (file_exists(CACHE_FILE) && (time() - filemtime(CACHE_FILE)) < CACHE_TTL) {
    echo file_get_contents(CACHE_FILE);
    exit;
}

/* ── Google Places API aufrufen ───────────────────────────────────────────── */
$url = sprintf(
    'https://maps.googleapis.com/maps/api/place/details/json?place_id=%s&fields=rating,user_ratings_total&language=de&key=%s',
    urlencode(GOOGLE_PLACE_ID),
    urlencode(GOOGLE_API_KEY)
);

$ctx  = stream_context_create(['http' => ['timeout' => 5]]);
$body = @file_get_contents($url, false, $ctx);

if ($body === false) {
    // Netzwerkfehler → alten Cache zurückgeben oder Fallback
    echo file_exists(CACHE_FILE) ? file_get_contents(CACHE_FILE) : '{"rating":5.0,"total":0}';
    exit;
}

$data = json_decode($body, true);

if (empty($data['result'])) {
    // API-Fehler → alten Cache zurückgeben
    echo file_exists(CACHE_FILE) ? file_get_contents(CACHE_FILE) : '{"rating":5.0,"total":0}';
    exit;
}

/* ── Ergebnis cachen und ausgeben ─────────────────────────────────────────── */
$result = json_encode([
    'rating'  => round((float)($data['result']['rating'] ?? 5.0), 1),
    'total'   => (int)($data['result']['user_ratings_total'] ?? 0),
    'updated' => date('Y-m-d H:i'),
], JSON_UNESCAPED_UNICODE);

file_put_contents(CACHE_FILE, $result);
echo $result;
