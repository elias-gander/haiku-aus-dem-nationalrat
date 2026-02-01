import json
from pathlib import Path
from supabase import create_client

with open("..env.json", "r") as f:
    config = json.load(f)

supabase = create_client(config["SUPABASE_URL"], config["SUPABASE_KEY"])

json_path = Path(__file__).resolve().parent / "haikus.json"
with open(json_path, "r", encoding="utf-8") as f:
    haikus = json.load(f)

response = supabase.table("haikus").upsert(haikus, on_conflict="id").execute()

print(f"✅ Inserted/updated {len(haikus)} haikus")
