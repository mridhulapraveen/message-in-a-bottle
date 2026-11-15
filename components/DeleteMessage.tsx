"use client";

import { deleteEntry } from "@/app/actions";

export function DeleteMessage({ entryId }: { entryId: number }) {
  return (
    <form
      action={deleteEntry}
      onSubmit={(event) => {
        if (!confirm("Throw this message back to the sea?")) event.preventDefault();
      }}
    >
      <input type="hidden" name="entry_id" value={entryId} />
      <button className="ghost" type="submit">
        Delete
      </button>
    </form>
  );
}
