# Terraform state bucket
module "tfstate_bucket" {
  source      = "../../modules/cos-static-site"
  bucket_name = "tfstate-${var.app_id}"
  region      = var.region
  acl         = "private"
  enable_website = false
  tags        = var.tags
}

# Game static assets bucket (fallback / backup for EdgeOne Pages)
module "game_bucket" {
  source      = "../../modules/cos-static-site"
  bucket_name = "${var.project_name}-${var.app_id}"
  region      = var.region
  acl         = "public-read"
  enable_website = true
  index_document = "index.html"
  error_document  = "index.html"
  cors_allowed_origins = ["https://*.edgeoneapp.com", "https://*.myqcloud.com"]
  tags        = var.tags
}
