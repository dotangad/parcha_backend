table "user" {
  schema = schema.public
  column "id" {
    null    = false
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "email" {
    null = false
    type = character_varying(255)
  }
  column "name" {
    null = true
    type = character_varying(255)
  }
  column "created_at" {
    null    = true
    type    = timestamptz
    default = sql("CURRENT_TIMESTAMP")
  }
  column "google_id" {
    null = true
    type = character_varying(30)
  }
  column "picture" {
    null = true
    type = text
  }
  primary_key {
    columns = [column.id]
  }
  unique "user_email_key" {
    columns = [column.email]
  }
  unique "user_gid_email_key" {
    columns = [column.google_id, column.email]
  }
}

schema "public" {
  comment = "standard public schema"
}
