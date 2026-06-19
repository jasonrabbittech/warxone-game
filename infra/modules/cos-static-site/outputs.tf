output "bucket_name" {
  description = "COS bucket name"
  value       = tencentcloud_cos_bucket.this.bucket
}

output "bucket_url" {
  description = "COS bucket access URL"
  value       = "https://${tencentcloud_cos_bucket.this.bucket}.cos.${var.region}.myqcloud.com"
}

output "website_endpoint" {
  description = "COS static website endpoint"
  value       = var.enable_website ? "https://${tencentcloud_cos_bucket.this.bucket}.cos-website.${var.region}.myqcloud.com" : null
}
