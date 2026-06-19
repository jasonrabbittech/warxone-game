terraform {
  required_version = ">= 1.5.0"

  backend "cos" {
    region = "ap-hongkong"
    prefix = "warxone/terraform-state"
  }

  required_providers {
    tencentcloud = {
      source  = "tencentcloudstack/tencentcloud"
      version = ">= 1.81.0"
    }
  }
}

provider "tencentcloud" {
  region = var.region
}
