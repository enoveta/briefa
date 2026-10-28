# Briefa Admin Dashboard Update

The `/admin` dashboard now includes working content management for News, Jobs, Scholarships, Opportunities, Events, and Tenders; search and category/status filters; create/edit/publish/unpublish/delete actions; featured flags; source-feed status and refresh; homepage preview and slider limits; and JSON export/import backups.

## Preview storage note

Managed listings and dashboard preferences are saved in the browser's `localStorage` so the admin tools can be tested without adding a database to the project. Published managed listings are merged into the public site's feed when the site is opened in the same browser profile. This is suitable for local review, not a multi-user production CMS: content is not shared across devices or browsers, and `/admin` does not yet have authentication/role-based access. Before deploying the admin publicly, connect these operations to an authenticated backend and persistent database.

## Run locally

From `frontend/`, run `npm install` and `npm run dev`, then open `/admin` in the same browser profile as the public site.
