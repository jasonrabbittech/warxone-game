variable "region" {
  description = "Tencent Cloud region"
  type        = string
  default     = "ap-hongkong"
}

variable "app_id" {
  description = "Tencent Cloud APPID"
  type        = string
  default     = "1376958570"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "warxone"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "warxone"
    Environment = "prod"
    ManagedBy   = "terraform"
    Owner       = "isaac"
  }
}
