#!/usr/bin/env python3
"""Generate complete i18n.ts with all languages fully translated."""
import re, json

# Read current file for English keys
with open('src/lib/i18n.ts', 'r') as f:
    content = f.read()

en_section = re.search(r"en:\s*\{(.*?)\n\s*\},\s*\n\s*nl:", content, re.DOTALL)
en_pairs = {}
for m in re.finditer(r"(\w+):\s*'(.*?)'", en_section.group(1)):
    en_pairs[m.group(1)] = m.group(2)

print(f"English has {len(en_pairs)} keys")

# Extract Dutch (already complete)
nl_section = re.search(r"nl:\s*\{(.*?)\n\s*\},\s*\n\s*fr:", content, re.DOTALL)
nl_pairs = {}
for m in re.finditer(r"(\w+):\s*'(.*?)'", nl_section.group(1)):
    nl_pairs[m.group(1)] = m.group(2)

# Extract French (already complete)
fr_section = re.search(r"fr:\s*\{(.*?)\n\s*\},\s*\n\s*de:", content, re.DOTALL)
fr_pairs = {}
for m in re.finditer(r"(\w+):\s*'(.*?)'", fr_section.group(1)):
    fr_pairs[m.group(1)] = m.group(2)

# Complete translations for remaining languages
# Each has ALL 221 keys

lang_data = {}

# GERMAN (complete)
lang_data['de'] = {
    'appName': 'Steinweg Dock', 'appSubtitle': 'C. Steinweg Belgium N.V. — Hafen von Antwerpen',
    'digitalDock': 'Digitales Dock-Managementsystem', 'welcome': 'Willkommen',
    'loadDemo': 'Demodaten laden & starten', 'signIn': 'Anmelden', 'signOut': 'Abmelden',
    'chooseProfile': 'Wählen Sie Ihr Profil', 'enterCredentials': 'Geben Sie Ihre Zugangsdaten ein',
    'email': 'E-Mail', 'password': 'Passwort', 'invalidLogin': 'Ungültige E-Mail oder Passwort',
    'backToProfiles': '← Zurück zu Profilen', 'orEmail': 'Oder mit E-Mail anmelden',
    'loading': 'Laden...', 'saving': 'Speichern...', 'deleting': 'Löschen...',
    'cancelling': 'Abbrechen...', 'confirming': 'Bestätigen...', 'submitting': 'Senden...',
    'success': 'Erfolg', 'error': 'Fehler', 'cancel': 'Abbrechen', 'save': 'Speichern',
    'delete': 'Löschen', 'edit': 'Bearbeiten', 'add': 'Hinzufügen', 'create': 'Erstellen',
    'close': 'Schließen', 'search': 'Suchen...', 'filter': 'Filter',
    'noResults': 'Keine Ergebnisse gefunden', 'actions': 'Aktionen', 'status': 'Status',
    'details': 'Details', 'notes': 'Notizen', 'date': 'Datum', 'time': 'Zeit', 'name': 'Name',
    'role': 'Rolle', 'phone': 'Telefon', 'badge': 'Abzeichen', 'active': 'Aktiv',
    'inactive': 'Inaktiv', 'dashboard': 'Dashboard', 'shifts': 'Schichten',
    'cargo': 'Ladungsoperationen', 'documents': 'Dokumente', 'safety': 'Sicherheit',
    'trucks': 'Lkw-Besuche', 'warehouses': 'Lagerhäuser', 'notifications': 'Benachrichtigungen',
    'reports': 'Berichte', 'admin': 'Verwaltung', 'settings': 'Einstellungen',
    'language': 'Sprache', 'changePassword': 'Passwort ändern', 'myProfile': 'Mein Profil',
    'activeShifts': 'Aktive Schichten', 'pendingCargo': 'Ladung ausstehend',
    'inProgressCargo': 'In Bearbeitung', 'completedCargo': 'Abgeschlossen',
    'expectedTrucks': 'Erwartete Lkw', 'atDockTrucks': 'Am Dock',
    'pendingDocs': 'Ausstehende Dokumente', 'activeSafety': 'Aktive Sicherheitskontrollen',
    'unreadNotifs': 'Ungelesene Benachrichtigungen', 'totalWorkers': 'Hafenarbeiter',
    'totalChauffeurs': 'Fahrer', 'recentActivity': 'Letzte Aktivität',
    'quickActions': 'Schnellaktionen', 'warehouseOverview': 'Lagerübersicht',
    'occupied': 'Belegt', 'checkIn': 'Einstempeln', 'checkOut': 'Ausstempeln',
    'shiftType': 'Schichttyp', 'day': 'Tag', 'night': 'Nacht', 'location': 'Standort',
    'startShift': 'Schicht starten', 'endShift': 'Schicht beenden',
    'shiftHistory': 'Schichtverlauf', 'currentShift': 'Aktuelle Schicht',
    'unloading': 'Entladen', 'loading': 'Laden', 'tally': 'Zählen',
    'vesselName': 'Schiffsname', 'voyageNumber': 'Reisenummer', 'berthNumber': 'Liegeplatz',
    'cargoType': 'Ladungstyp', 'reference': 'Referenz', 'weight': 'Gewicht',
    'unitCount': 'Einheitenanzahl', 'description': 'Beschreibung',
    'assignedTo': 'Zugewiesen an', 'startOperation': 'Operation starten',
    'completeOperation': 'Operation abschließen', 'addCargoItem': 'Ladungsposition hinzufügen',
    'itemType': 'Positionstyp', 'markOrNumber': 'Marke/Nummer', 'quantity': 'Menge',
    'condition': 'Zustand', 'good': 'Gut', 'damaged': 'Beschädigt', 'missing': 'Fehlend',
    'damageNotes': 'Schadenhinweise', 'checked': 'Geprüft', 'storageLocation': 'Lagerort',
    'breakbulk': 'Stückgut', 'container': 'Container', 'bulk': 'Schüttgut', 'roro': 'RoRo',
    'driverName': 'Fahrername', 'driverLicense': 'Führerschein', 'company': 'Firma',
    'truckPlate': 'Kennzeichen Lkw', 'trailerPlate': 'Kennzeichen Anhänger',
    'purpose': 'Zweck', 'pickup': 'Abholung', 'delivery': 'Lieferung',
    'dockNumber': 'Docknummer', 'expectedArrival': 'Erwartete Ankunft',
    'arrivedAt': 'Angekommen um', 'dockAssignedAt': 'Dock zugewiesen',
    'completedAt': 'Abgeschlossen um', 'cargoDescription': 'Ladungsbeschreibung',
    'blReference': 'K/L-Referenz', 'bookingRef': 'Buchungsreferenz',
    'markArrived': 'Als angekommen markieren', 'assignDock': 'Dock zuweisen',
    'markComplete': 'Als abgeschlossen markieren', 'docType': 'Dokumenttyp',
    'billOfLading': 'Konnossement', 'deliveryNote': 'Lieferschein',
    'damageReport': 'Schadensbericht', 'tallySheet': 'Zählblatt',
    'customsDoc': 'Zolldokument', 'warehouseReceipt': 'Lagereingangsbestätigung',
    'draft': 'Entwurf', 'pendingReview': 'Überprüfung ausstehend', 'approved': 'Genehmigt',
    'signed': 'Unterschrieben', 'rejected': 'Abgelehnt',
    'signDocument': 'Dokument unterschreiben', 'requestSignature': 'Unterschrift anfordern',
    'addSignature': 'Unterschrift hinzufügen', 'signedBy': 'Unterschrieben von',
    'signerRole': 'Rolle des Unterzeichners', 'signedAt': 'Unterschrieben am',
    'checkType': 'Kontrolltyp', 'preShift': 'Vorschicht', 'routine': 'Routine',
    'incident': 'Vorfall', 'location2': 'Standort', 'startCheck': 'Kontrolle starten',
    'completeCheck': 'Kontrolle abschließen',
    'personalProtective': 'Persönliche Schutzausrüstung', 'equipment': 'Ausrüstung',
    'workArea': 'Arbeitsbereich', 'emergency': 'Notfall',
    'hardHat': 'Schutzhelm getragen und in gutem Zustand?',
    'safetyBoots': 'Sicherheitsschuhe getragen?', 'highViz': 'Warnweste getragen?',
    'safetyGlasses': 'Schutzbrille verfügbar?',
    'craneInspection': 'Kran-Vorabinspektion durchgeführt?',
    'slingsInspection': 'Hebebänder und Ketten geprüft?',
    'forkliftCheck': 'Gabelstapler-Tageskontrolle durchgeführt?',
    'dockClear': 'Dockbereich frei von Hindernissen?',
    'warningSigns': 'Warnschilder und Barrieren vorhanden?',
    'adequateLighting': 'Ausreichende Beleuchtung?',
    'fireExtinguishers': 'Feuerlöscher erreichbar?', 'emergencyExits': 'Notausgänge frei?',
    'firstAidKit': 'Erste-Hilfe-Set verfügbar und vollständig?',
    'userManagement': 'Benutzerverwaltung', 'addUser': 'Benutzer hinzufügen',
    'editUser': 'Benutzer bearbeiten', 'deactivateUser': 'Benutzer deaktivieren',
    'activateUser': 'Benutzer aktivieren', 'resetPassword': 'Passwort zurücksetzen',
    'auditLog': 'Audit-Protokoll', 'systemStats': 'Systemstatistiken',
    'totalUsers': 'Benutzer gesamt', 'adminUsers': 'Administratoren',
    'auditTrail': 'Audit-Spur', 'action': 'Aktion', 'performedBy': 'Ausgeführt von',
    'target': 'Ziel', 'timestamp': 'Zeitstempel', 'oldValue': 'Alter Wert',
    'newValue': 'Neuer Wert', 'myDeliveries': 'Meine Lieferungen',
    'myPickups': 'Meine Abholungen', 'dockAssignment': 'Dockzuweisung',
    'waitingTime': 'Wartezeit', 'translatePage': 'Seite übersetzen',
    'scanQR': 'QR-Code scannen', 'deliveryConfirmation': 'Lieferbestätigung',
    'confirmPickup': 'Abholung bestätigen', 'confirmDelivery': 'Lieferung bestätigen',
    'photoEvidence': 'Fotonachweis', 'takePhoto': 'Foto aufnehmen',
    'signatureRequired': 'Unterschrift erforderlich',
    'pleaseSign': 'Bitte unterschreiben Sie unten', 'clearSignature': 'Löschen',
    'currentPassword': 'Aktuelles Passwort', 'newPassword': 'Neues Passwort',
    'confirmPassword': 'Passwort bestätigen', 'passwordMismatch': 'Passwörter stimmen nicht überein',
    'passwordTooShort': 'Passwort muss mindestens 6 Zeichen haben',
    'passwordChanged': 'Passwort erfolgreich geändert',
    'passwordChangeError': 'Passwortänderung fehlgeschlagen',
    'darkMode': 'Dunkelmodus', 'lightMode': 'Hellmodus', 'fullscreen': 'Vollbild',
    'exportData': 'Daten exportieren', 'printView': 'Druckansicht',
    'refreshData': 'Aktualisieren', 'lastUpdated': 'Zuletzt aktualisiert',
    'offlineMode': 'Offlinemodus', 'dataSaved': 'Daten lokal gespeichert',
    'syncComplete': 'Synchronisation abgeschlossen', 'keyboardShortcuts': 'Tastenkürzel',
}

# Save all generated translations
with open('/tmp/i18n_generated.json', 'w', encoding='utf-8') as f:
    json.dump(lang_data, f, ensure_ascii=False)

print(f"Generated DE: {len(lang_data['de'])} keys")
print("Now need to generate ES, PL, TR, AR, RO, PT, IT, CS, UK, ZH, RU, HI")
print("This is too many to do manually - will use a smarter approach")
PYEOF