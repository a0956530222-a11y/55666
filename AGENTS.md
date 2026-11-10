# Repository Guidelines

## Project Scope and Structure

`報修需求筆記.txt` is the requirements reference for a demo maintenance request tracker. The current workspace contains the requirements note only. Keep it at the root and update it when an agreed requirement changes. The planned deliverables are a web form and list, a Supabase schema and access policies, an Excel field and sample-data sheet, a six-slide PowerPoint proposal, and a Word user guide.

## Development and Naming

The first web implementation should let users submit a request and view the shared list. Use the categories, urgency levels, and status labels defined in the requirements note, and generate the registration timestamp automatically. Keep field names consistent across the form, database, and Excel sheet. Use UTF-8 for files containing Traditional Chinese text.

The workspace has no build, lint, or test commands yet. When adding application code, document the exact setup, local run, and verification commands and identify where source files and tests live.

## Verification and Data Access

- Submit a fictional request and verify that it appears in the list with the expected fields and an automatically generated timestamp.
- Enable Supabase row-level security. Verify with the public client that inserts and reads are allowed and that updates and deletes are denied. Keep privileged credentials out of the frontend and use fictional names and locations in all sample data.
- Keep login, status editing, and notifications outside the initial demo scope until the requirements are agreed.

## Commits and Pull Requests

Once Git is initialized, use short, imperative commit subjects such as `Add maintenance request form`. Describe the behavior change and how you verified it in each pull request. Link the related issue when available and include screenshots for changes to the form or list.
