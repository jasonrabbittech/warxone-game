resource "tencentcloud_cos_bucket" "this" {
  bucket = var.bucket_name
  acl    = var.acl

  dynamic "website" {
    for_each = var.enable_website ? [1] : []
    content {
      index_document = var.index_document
      error_document = var.error_document
    }
  }

  cors_rules {
    allowed_origins = var.cors_allowed_origins
    allowed_methods = ["GET", "HEAD"]
    allowed_headers = ["*"]
    max_age_seconds = 3600
  }

  tags = merge(var.tags, {
    ManagedBy = "terraform"
    Project   = "warxone"
  })
}
