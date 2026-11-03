<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Camp memories use a private Cloud Storage bucket with read/insert-only visitor policies and a public metadata table; visitors can contribute without accounts but cannot modify or delete others’ photos.
- Contribution validation lives in `src/lib/memories.ts`, with database constraints and storage policies enforcing the same limits; the existing gallery loads new contributions client-side and refreshes signed image URLs before expiry.
