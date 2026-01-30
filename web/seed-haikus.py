import json
from supabase import create_client

SUPABASE_URL = "https://ngbqkyogyfuicsfzccmo.supabase.co"
SUPABASE_SERVICE_KEY = "sb_publishable_btbtmwera16wp29oidFEug_HcSGMo3Q"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

with open("haikus.json", "r", encoding="utf-8") as f:
    haikus = json.load(f)

response = supabase.table("haikus").upsert(haikus, on_conflict="id").execute()

print(f"✅ Inserted/updated {len(haikus)} haikus")
