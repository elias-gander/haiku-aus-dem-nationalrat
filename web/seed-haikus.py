import json
import os
from supabase import create_client

with open("env.json", "r") as f:
    config = json.load(f)

supabase = create_client(config["SUPABASE_URL"], config["SUPABASE_KEY"])

with open("haikus.json", "r", encoding="utf-8") as f:
    haikus = json.load(f)

response = supabase.table("haikus").upsert(haikus, on_conflict="id").execute()

print(f"✅ Inserted/updated {len(haikus)} haikus")
