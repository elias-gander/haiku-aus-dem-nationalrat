drop extension if exists "pg_net";

create type "public"."party" as enum ('ÖVP', 'SPÖ', 'FPÖ', 'GRÜNE', 'NEOS', 'BZÖ', 'STRONACH', 'PILZ', 'Ohne Klub');


  create table "public"."haikus" (
    "id" text not null,
    "person_id" text not null,
    "person_name" text not null,
    "period" smallint not null,
    "period_roman" text not null,
    "session" smallint not null,
    "date" date not null,
    "line1" text not null,
    "line2" text not null,
    "line3" text not null,
    "context_before" text not null,
    "context_after" text not null,
    "image_url" text not null,
    "parties" public.party[] not null
      );


alter table "public"."haikus" enable row level security;


  create table "public"."scores" (
    "haiku_id" text not null,
    "upvotes" integer default 0,
    "downvotes" integer default 0
      );


alter table "public"."scores" enable row level security;


  create table "public"."votes" (
    "haiku_id" text not null,
    "anon_id" text not null,
    "vote" smallint not null
      );


alter table "public"."votes" enable row level security;

CREATE UNIQUE INDEX haikus_pkey ON public.haikus USING btree (id);

CREATE UNIQUE INDEX scores_pkey ON public.scores USING btree (haiku_id);

CREATE UNIQUE INDEX votes_pkey ON public.votes USING btree (haiku_id, anon_id);

alter table "public"."haikus" add constraint "haikus_pkey" PRIMARY KEY using index "haikus_pkey";

alter table "public"."scores" add constraint "scores_pkey" PRIMARY KEY using index "scores_pkey";

alter table "public"."votes" add constraint "votes_pkey" PRIMARY KEY using index "votes_pkey";

alter table "public"."scores" add constraint "scores_haiku_id_fkey" FOREIGN KEY (haiku_id) REFERENCES public.haikus(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."scores" validate constraint "scores_haiku_id_fkey";

alter table "public"."votes" add constraint "votes_haiku_id_fkey" FOREIGN KEY (haiku_id) REFERENCES public.haikus(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."votes" validate constraint "votes_haiku_id_fkey";

alter table "public"."votes" add constraint "votes_vote_check" CHECK ((vote = ANY (ARRAY[1, '-1'::integer]))) not valid;

alter table "public"."votes" validate constraint "votes_vote_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_haiku_with_scores(p_anon_id text, p_haiku_id text DEFAULT NULL::text)
 RETURNS TABLE(haiku public.haikus_with_scores, has_voted_up boolean, has_voted_down boolean)
 LANGUAGE sql
 STABLE
AS $function$select
    hws,

    exists (
      select 1
      from public.votes v
      where v.haiku_id = hws.id
        and v.anon_id = p_anon_id
        and v.vote = 1
    ) as has_voted_up,

    exists (
      select 1
      from public.votes v
      where v.haiku_id = hws.id
        and v.anon_id = p_anon_id
        and v.vote = -1
    ) as has_voted_down

  from public.haikus_with_scores hws
  where
    p_haiku_id is null
    or hws.id = p_haiku_id
  order by
    case when p_haiku_id is null then random() end
  limit 1;$function$
;

create or replace view "public"."haikus_leaderboard" as  SELECT h.id,
    h.line1,
    h.line2,
    h.line3,
    h.person_id,
    h.person_name,
    COALESCE(s.upvotes, 0) AS upvotes,
    COALESCE(s.downvotes, 0) AS downvotes
   FROM (public.haikus h
     LEFT JOIN public.scores s ON ((s.haiku_id = h.id)));


create or replace view "public"."haikus_with_scores" as  SELECT h.id,
    h.person_id,
    h.person_name,
    h.period,
    h.period_roman,
    h.session,
    h.date,
    h.line1,
    h.line2,
    h.line3,
    h.context_before,
    h.context_after,
    h.image_url,
    h.parties,
    COALESCE(s.upvotes, 0) AS upvotes,
    COALESCE(s.downvotes, 0) AS downvotes
   FROM (public.haikus h
     LEFT JOIN public.scores s ON ((s.haiku_id = h.id)));


create or replace view "public"."personen_leaderboard" as  SELECT h.person_id,
    h.person_name,
    count(h.id) AS haiku_count,
    sum(COALESCE(s.upvotes, 0)) AS upvotes,
    sum(COALESCE(s.downvotes, 0)) AS downvotes
   FROM (public.haikus h
     LEFT JOIN public.scores s ON ((s.haiku_id = h.id)))
  GROUP BY h.person_id, h.person_name;


CREATE OR REPLACE FUNCTION public.update_scores()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  -- ensure scores row exists
  insert into scores (haiku_id)
  values (new.haiku_id)
  on conflict (haiku_id) do nothing;

  -- INSERT case
  if tg_op = 'INSERT' then
    if new.vote = 1 then
      update scores set upvotes = upvotes + 1 where haiku_id = new.haiku_id;
    else
      update scores set downvotes = downvotes + 1 where haiku_id = new.haiku_id;
    end if;
  end if;

  -- UPDATE case (vote changed)
  if tg_op = 'UPDATE' and old.vote != new.vote then
    -- remove old vote
    if old.vote = 1 then
      update scores set upvotes = upvotes - 1 where haiku_id = new.haiku_id;
    else
      update scores set downvotes = downvotes - 1 where haiku_id = new.haiku_id;
    end if;

    -- add new vote
    if new.vote = 1 then
      update scores set upvotes = upvotes + 1 where haiku_id = new.haiku_id;
    else
      update scores set downvotes = downvotes + 1 where haiku_id = new.haiku_id;
    end if;
  end if;

  return null;
end;
$function$
;

grant delete on table "public"."haikus" to "anon";

grant insert on table "public"."haikus" to "anon";

grant references on table "public"."haikus" to "anon";

grant select on table "public"."haikus" to "anon";

grant trigger on table "public"."haikus" to "anon";

grant truncate on table "public"."haikus" to "anon";

grant update on table "public"."haikus" to "anon";

grant delete on table "public"."haikus" to "authenticated";

grant insert on table "public"."haikus" to "authenticated";

grant references on table "public"."haikus" to "authenticated";

grant select on table "public"."haikus" to "authenticated";

grant trigger on table "public"."haikus" to "authenticated";

grant truncate on table "public"."haikus" to "authenticated";

grant update on table "public"."haikus" to "authenticated";

grant delete on table "public"."haikus" to "service_role";

grant insert on table "public"."haikus" to "service_role";

grant references on table "public"."haikus" to "service_role";

grant select on table "public"."haikus" to "service_role";

grant trigger on table "public"."haikus" to "service_role";

grant truncate on table "public"."haikus" to "service_role";

grant update on table "public"."haikus" to "service_role";

grant delete on table "public"."scores" to "anon";

grant insert on table "public"."scores" to "anon";

grant references on table "public"."scores" to "anon";

grant select on table "public"."scores" to "anon";

grant trigger on table "public"."scores" to "anon";

grant truncate on table "public"."scores" to "anon";

grant update on table "public"."scores" to "anon";

grant delete on table "public"."scores" to "authenticated";

grant insert on table "public"."scores" to "authenticated";

grant references on table "public"."scores" to "authenticated";

grant select on table "public"."scores" to "authenticated";

grant trigger on table "public"."scores" to "authenticated";

grant truncate on table "public"."scores" to "authenticated";

grant update on table "public"."scores" to "authenticated";

grant delete on table "public"."scores" to "service_role";

grant insert on table "public"."scores" to "service_role";

grant references on table "public"."scores" to "service_role";

grant select on table "public"."scores" to "service_role";

grant trigger on table "public"."scores" to "service_role";

grant truncate on table "public"."scores" to "service_role";

grant update on table "public"."scores" to "service_role";

grant delete on table "public"."votes" to "anon";

grant insert on table "public"."votes" to "anon";

grant references on table "public"."votes" to "anon";

grant select on table "public"."votes" to "anon";

grant trigger on table "public"."votes" to "anon";

grant truncate on table "public"."votes" to "anon";

grant update on table "public"."votes" to "anon";

grant delete on table "public"."votes" to "authenticated";

grant insert on table "public"."votes" to "authenticated";

grant references on table "public"."votes" to "authenticated";

grant select on table "public"."votes" to "authenticated";

grant trigger on table "public"."votes" to "authenticated";

grant truncate on table "public"."votes" to "authenticated";

grant update on table "public"."votes" to "authenticated";

grant delete on table "public"."votes" to "service_role";

grant insert on table "public"."votes" to "service_role";

grant references on table "public"."votes" to "service_role";

grant select on table "public"."votes" to "service_role";

grant trigger on table "public"."votes" to "service_role";

grant truncate on table "public"."votes" to "service_role";

grant update on table "public"."votes" to "service_role";


  create policy "Enable read access for all users"
  on "public"."haikus"
  as permissive
  for select
  to public
using (true);



  create policy "Enable read access for all users"
  on "public"."scores"
  as permissive
  for select
  to public
using (true);



  create policy "Enable +-1 insert for all users"
  on "public"."votes"
  as permissive
  for insert
  to public
with check ((vote = ANY (ARRAY[1, '-1'::integer])));



  create policy "Enable +-1 update for all users"
  on "public"."votes"
  as permissive
  for update
  to public
using (true)
with check ((vote = ANY (ARRAY[1, '-1'::integer])));



  create policy "Enable read access for all users"
  on "public"."votes"
  as permissive
  for select
  to public
using (true);


CREATE TRIGGER votes_scores_trigger AFTER INSERT OR UPDATE ON public.votes FOR EACH ROW EXECUTE FUNCTION public.update_scores();


