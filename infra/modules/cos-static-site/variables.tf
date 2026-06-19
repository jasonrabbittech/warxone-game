variable "bucket_name" {
  description = "COS bucket name (must be <name>-<APPID> format)"
  type        = string
}

variable "region" {
  description = "Tencent Cloud region"
  type        = string
  default     = "ap-hongkong"
}

variable "acl" {
  description = "COS bucket ACL"
  type        = string
  default     = "public-read"
}

variable "enable_website" {
  description = "Enable static website hosting"
  type        = bool
  default     = true
}

variable "index_document" {
  description = "Index document for static website"
  type        = string
  default     = "index.html"
}

variable "error_document" {
  description = "Error document for static website"
  type        = string
  default     = "index.html"
}

variable "cors_allowed_origins" {
  description = "List of allowed origins for CORS"
  type        = list(string)
  default     = ["*"]
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
