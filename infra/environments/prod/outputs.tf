output "tfstate_bucket" {
  description = "Terraform state bucket name"
  value       = module.tfstate_bucket.bucket_name
}

output "game_bucket" {
  description = "Game static assets bucket name"
  value       = module.game_bucket.bucket_name
}

output "game_website_url" {
  description = "Game static website URL (COS fallback)"
  value       = module.game_bucket.website_endpoint
}
