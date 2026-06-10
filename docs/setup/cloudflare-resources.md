# Cloudflare Resources

Project slug: `code-nest`

## D1

| Purpose | Name | Binding | Database ID |
| --- | --- | --- | --- |
| Shared/dev | `code-nest-dev-db` | `DB` | `f9d2b16f-3358-49c2-a88e-e72c9339a22b` |
| Production | `code-nest-prod-db` | `DB` | `a66fac5e-c122-466d-b7fe-5910ba6a98b9` |

## R2

| Purpose | Name | Binding |
| --- | --- | --- |
| Shared/dev | `code-nest-dev-uploads` | `BUCKET` |
| Production | `code-nest-prod-uploads` | `BUCKET` |

## Safety

- Dev resources are safe for shared development workflows.
- Production resources are production-only.
- Outside developers should not receive D1 credentials or Cloudflare account access.
- R2 S3 credentials, if issued, must target dev workflows only.

