import React, { useMemo, useState } from "react";

export default function FriendTagPicker({
  friends = [],
  loading = false,
  error = "",
  selectedIds = [],
  onChange,
  inputValue = "",
  setInputValue,
}) {
  const [open, setOpen] = useState(true);

  const selected = useMemo(
    () =>
      friends.filter((friend) =>
        selectedIds.includes(String(friend._id))
      ),
    [friends, selectedIds]
  );

  const search = inputValue.trim().toLowerCase();

  const suggestions = useMemo(() => {
    return friends
      .filter((friend) => {
        const id = String(friend._id);
        const name = (friend.name || "").toLowerCase();
        const username = (friend.username || "").toLowerCase();

        return (
          !selectedIds.includes(id) &&
          (!search || name.includes(search) || username.includes(search))
        );
      })
      .slice(0, 8);
  }, [friends, selectedIds, search]);

  const selectFriend = (friend) => {
    const id = String(friend?._id || "");
    if (!id || selectedIds.includes(id)) return;

    if (selectedIds.length >= 50) return;

    onChange?.([...selectedIds, id]);
    setInputValue?.("");
    setOpen(true);
  };

  const removeFriend = (id) => {
    onChange?.(selectedIds.filter((selectedId) => selectedId !== id));
  };

  return (
    <div className="w-full space-y-3">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((friend) => (
            <span
              key={friend._id}
              className="inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-500/10 py-1 pl-1 pr-2 text-xs text-white"
            >
              {friend.profilePic ? (
                <img
                  src={friend.profilePic}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700">
                  {(friend.name || friend.username || "F")
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}

              <span>{friend.name || friend.username || "Friend"}</span>

              <button
                type="button"
                onClick={() => removeFriend(String(friend._id))}
                aria-label={`Remove ${friend.name || "friend"}`}
                className="rounded-full px-1 text-white/70 hover:bg-white/10 hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={inputValue}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setInputValue?.(event.target.value);
          setOpen(true);
        }}
        placeholder="Search friends by name or username..."
        autoComplete="off"
        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-blue-500"
      />

      {loading && (
        <p className="text-xs text-zinc-400">Loading your friends...</p>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      {open && !loading && suggestions.length > 0 && (
        <div className="max-h-56 overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950">
          {suggestions.map((friend) => (
            <button
              key={friend._id}
              type="button"
              onClick={() => selectFriend(friend)}
              className="flex w-full items-center gap-3 border-b border-zinc-800 p-3 text-left last:border-b-0 hover:bg-zinc-800"
            >
              {friend.profilePic ? (
                <img
                  src={friend.profilePic}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700 text-white">
                  {(friend.name || friend.username || "F")
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-white">
                  {friend.name || "Friend"}
                </span>
                {friend.username && (
                  <span className="block truncate text-xs text-zinc-400">
                    @{friend.username}
                  </span>
                )}
              </span>

              <span className="text-xs text-blue-400">Add</span>
            </button>
          ))}
        </div>
      )}

      {open && !loading && search && suggestions.length === 0 && !error && (
        <p className="text-xs text-zinc-400">No matching friends found.</p>
      )}

      <p className="text-xs text-zinc-500">
        {selectedIds.length}/50 friends selected.
      </p>
    </div>
  );
}
