# Haiku aus dem Nationalrat

Haiku ist eine traditionelle japanische Gedichtform in drei Zeilen mit einer Silbenstruktur von 5 - 7 - 5.

Solche Haiku aus den Sitzungsprotokollen des Nationalrat extrahieren und online mit einer Abstimmungsinfrastruktur darstellen.

Datenbasis dafür sind die [stenographischen Protokolle](https://www.parlament.gv.at/recherchieren/open-data/daten-und-lizenz/stenographische-protkolle/index.html) des Nationalrat.
Für den Zeitraum von Dezember 2002 bis heute dankenswerterweise durch [Mario Zechner's](https://mariozechner.at) Projekt [woswormeileistung](https://github.com/badlogic/woswormeileistung) in sauber strukturierter Form verfügbar.

[Demo](https://elias-gander.github.io/data-visualization/haiku-aus-dem-nationalrat/)

## Setup

1. Repo clonen

2. Virtuelles Python-environment erstellen und aktivieren:
   1. Im Terminal zum Root-Folders des Repos navigieren.
   2. `python -m venv ./venv`
   3. `source venv/bin/activate`

3. Benötigte Python Packages installieren: `pip install -r requirements.txt`

4. Parlament Datensets erzeugen:
   1. In dieses Repo das Repo von [woswormeileistung](https://github.com/badlogic/woswormeileistung) clonen.

   2. Datenextraktion durchführen wie beschrieben in [README.md](https://github.com/badlogic/woswormeileistung/blob/main/README.md).  
      Nach diesem Schritt sollten unter `woswormeileistung/data` zwei Datensets `persons.json` und `sessions.json` liegen.

5. Alle Zellen des Jupyter-Notebooks `notebook.ipynb` ausführen (kann mehrere Stunden dauern!).

6. Postgres-Backend aufsetzen:
   - Auf [Supabase](https://supabase.com) einen Account anlegen.
   - Projekt erstellen
   - SQL Statements in `web/db/db-schema.sql` im Supabase Projekt ausführen.
   - Supabase-URL und -Key in `web/env-template.json` einfügen und umbenennen auf `env.json`.

7. Haiku in Datenbank einspielen:
   - In Supabase die RLS (Row Level Security) Policies für die `haiku` Tabelle abdrehen.
   - `python web/db/seed-haikus.py`
   - RLS wieder aufdrehen!

8. Lokalen Server starten: `python -m http.server -d web`

9. Im Browser zu _http://localhost:8000_ navigieren
