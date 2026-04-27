<?php
/**
 * mail.php – Kontaktformular-Backend
 * Bautrocknung Paderborn GmbH
 */

// ============================================================
// ▼▼▼ HIER E-Mail-Adresse des Empfängers eintragen ▼▼▼
define('RECIPIENT_EMAIL', 'schaden@teutoplus.de');
define('RECIPIENT_NAME',  'Bautrocknung Paderborn GmbH');
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
// ============================================================

header('Content-Type: application/json; charset=utf-8');

// Nur POST erlauben
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Methode nicht erlaubt.']);
    exit;
}

// Honeypot: Bots füllen versteckte Felder aus → stille Ablehnung
if (!empty($_POST['website'])) {
    echo json_encode(['success' => true]);
    exit;
}

// Eingaben bereinigen
function clean(string $str): string {
    return htmlspecialchars(trim($str), ENT_QUOTES, 'UTF-8');
}

$name    = clean($_POST['name']    ?? '');
$email   = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$phone   = clean($_POST['phone']   ?? '');
$subject = clean($_POST['subject'] ?? '');
$geraet  = clean($_POST['geraet']  ?? '');
$message = clean($_POST['message'] ?? '');

// Pflichtfelder validieren
if (mb_strlen($name) < 2) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Bitte geben Sie Ihren Namen ein.']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Bitte geben Sie eine gültige E-Mail-Adresse ein.']);
    exit;
}
if (mb_strlen($message) < 10) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Bitte geben Sie eine Nachricht ein (mind. 10 Zeichen).']);
    exit;
}

// Themen-Labels
$subjectLabels = [
    'wasserschaden'       => 'Wasserschaden / Notfall',
    'bautrocknung'        => 'Bautrocknung & Sanierung',
    'leckageortung'       => 'Leckageortung',
    'schadstoffsanierung' => 'Schadstoffsanierung',
    'vermietung'          => 'Gerätevermietung',
    'angebot'             => 'Angebotsanfrage',
    'sonstiges'           => 'Sonstiges',
];
$subjectLabel = $subjectLabels[$subject] ?? ($subject ?: 'Allgemeine Anfrage');

// Geräte-Labels
$geraetLabels = [
    'ttk-75-eco'   => 'Trotec TTK 75 Eco – Kompakter Bautrockner',
    'ttk-105-s'    => 'Trotec TTK 105 S – Leistungsstarker Bautrockner',
    'ttk-170-s'    => 'Trotec TTK 170 S – Profi-Bautrockner',
    'ttk-355-s'    => 'Trotec TTK 355 S – Hochleistungs-Bautrockner',
    'fixtron-dv-50'=> 'Fixtron DV 50 – Dämmschichttrocknung',
    'qube-plus'    => 'Trotec Qube+ – Technische Trocknung',
];
$geraetLabel = $geraet ? ($geraetLabels[$geraet] ?? $geraet) : '';

// E-Mail-Text aufbauen
$body  = "Neue Kontaktanfrage über die Website\n";
$body .= str_repeat('=', 50) . "\n\n";
$body .= "Name:     {$name}\n";
$body .= "E-Mail:   {$email}\n";
if ($phone) {
    $body .= "Telefon:  {$phone}\n";
}
$body .= "Thema:    {$subjectLabel}\n";
if ($geraetLabel) {
    $body .= "Gerät:    {$geraetLabel}\n";
}
$body .= "\nNachricht:\n";
$body .= str_repeat('-', 30) . "\n";
$body .= $message . "\n\n";
$body .= str_repeat('=', 50) . "\n";
$body .= "Gesendet am: " . date('d.m.Y \u\m H:i') . " Uhr\n";

// E-Mail-Header
$headers  = "From: Website <noreply@bautrocknung-paderborn.de>\r\n";
$headers .= "Reply-To: {$name} <{$email}>\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "Content-Transfer-Encoding: 8bit\r\n";

// Betreff-Zeile mit UTF-8-Encoding
$mailSubject = '=?UTF-8?B?' . base64_encode("[Kontaktformular] {$subjectLabel} – {$name}") . '?=';

// E-Mail senden
$sent = mail(RECIPIENT_EMAIL, $mailSubject, $body, $headers);

if ($sent) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Die E-Mail konnte nicht gesendet werden. Bitte rufen Sie uns direkt an: 05251 7091421',
    ]);
}
