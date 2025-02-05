# AWS EC2 Monitoring Web Application 🚀

This repository contains the code, CloudFormation templates, and documentation to deploy the **AWS EC2 Monitoring Web Application**. This solution collects EC2 instance compliance data from multiple AWS accounts and displays it on a static website hosted on Amazon S3.

---

## 📚 Table of Contents

- [Project Overview](#project-overview)
- [Requirements](#requirements)
- [Deployment Steps](#deployment-steps)
  1. [Create S3 Bucket](#1-create-s3-bucket)
  2. [Static Website Hosting Configuration](#2-static-website-hosting-configuration)
  3. [CORS Configuration](#3-cors-configuration)
  4. [Bucket Policy Configuration](#4-bucket-policy-configuration)
  5. [Upload Static Website Files](#5-upload-static-website-files)
  6. [Deploy CloudFormation Template](#6-deploy-cloudformation-template)
  7. [Post-Deployment Configurations](#7-post-deployment-configurations)
- [Permissions Overview](#permissions-overview)
- [Lambda Function Variables](#lambda-function-variables)
- [Summary](#summary)

---

## 📊 Project Overview

The goal of this project is to provide a centralized dashboard to monitor EC2 instances across multiple AWS accounts. The solution consists of:

- **Amazon S3:** Hosting a static website to display instance data.
- **AWS Lambda:** Collecting compliance data periodically.
- **AWS CloudFormation:** Automating the deployment of IAM roles, Lambda functions, and EventBridge rules.

---

## ✅ Requirements

Before deploying, ensure you have:

- An **AWS Management Account** for creating and configuring the S3 bucket.
- Appropriate **permissions** to create IAM roles, S3 buckets, Lambda functions, EventBridge rules, and perform CloudFormation deployments.
- **AWS CLI** or access to the AWS Management Console.
- An S3 bucket name following the convention:  
  `swoec2monitoringwebapp-{client-name}`
- **Static Website Hosting** enabled on S3 with proper CORS and bucket policies.

---

## 🔧 Deployment Steps

### 1. Create S3 Bucket 📦

- **Create the Bucket:**  
  In your management account, create an S3 bucket named using the format:  
  `swoec2monitoringwebapp-{client-name}`
- **Public Access:**  
  Make the bucket public by unchecking the "Block Access" box.
- **Enable Static Website Hosting:**  
  Activate static website hosting for the bucket.

---

### 2. Static Website Hosting Configuration 🌐

- **Index Document:** Set to `index.html`.
- **Error Document:** Set to `error.html`.

---

### 3. CORS Configuration 🔄

In the bucket permissions, add the following CORS configuration:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
