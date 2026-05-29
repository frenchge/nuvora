"use client";

import { useMemo, useState } from "react";
import { SignOutButton } from "@clerk/nextjs";
import * as Dialog from "@radix-ui/react-dialog";
import { useLocale, useTranslations } from "next-intl";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import {
  ChevronDown,
  Code2,
  ImageIcon,
  Leaf,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
  Plus,
  Search,
  Settings,
  Shield,
  X,
} from "lucide-react";
import { InstantTooltip } from "@/components/ui/tooltip";
import { api } from "@convex/_generated/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BrandLogo } from "@/components/brand-logo";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// ── Chat row sub-component ──────────────────────────────────────────────────

function ChatRow({
  chat,
  active,
  onCloseMobile,
  onRename,
  onDelete,
  onTogglePin,
}: {
  chat: { id: string; title: string; pinned: boolean };
  active: boolean;
  onCloseMobile: () => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}) {
  const t = useTranslations("Sidebar");
  return (
    <div
      className={cn(
        "group flex items-center rounded-xl text-sm transition hover:bg-accent/50",
        active && "bg-accent/60",
      )}
    >
      <Link
        href={`/chat/${chat.id}`}
        prefetch
        onClick={onCloseMobile}
        className="min-w-0 flex-1 px-3 py-2 leading-snug"
        data-no-translate
        title={chat.title}
      >
        <span className="block truncate text-sm text-foreground/85">
          {chat.title || t("untitled")}
        </span>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="mr-1.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition hover:bg-accent group-hover:opacity-100 focus-visible:opacity-100"
            aria-label={t("conversationOptions")}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onTogglePin(chat.id)}>
            {chat.pinned ? (
              <>
                <PinOff className="mr-2 h-3.5 w-3.5" />
                {t("unpin")}
              </>
            ) : (
              <>
                <Pin className="mr-2 h-3.5 w-3.5" />
                {t("pin")}
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onRename(chat.id)}>
            {t("rename")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => onDelete(chat.id)}
            className="text-destructive focus:text-destructive"
          >
            {t("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ── Main sidebar ────────────────────────────────────────────────────────────

export function AppSidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapse,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Sidebar");
  const { isLoading, isAuthenticated } = useConvexAuth();
  const chats = useQuery(api.chats.listRecent, isAuthenticated ? {} : "skip");
  const profile = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const renameChat = useMutation(api.chats.rename);
  const deleteChat = useMutation(api.chats.remove);
  const togglePinMutation = useMutation(api.chats.togglePin);

  const [pinnedOpen, setPinnedOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const allChats = useMemo(() => chats ?? [], [chats]);

  const pinnedChats = useMemo(
    () => allChats.filter((c) => c.pinned),
    [allChats],
  );
  const recentChats = useMemo(
    () => allChats.filter((c) => !c.pinned),
    [allChats],
  );

  const filteredPinned = useMemo(() => {
    if (!searchQuery.trim()) return pinnedChats;
    const q = searchQuery.toLowerCase();
    return pinnedChats.filter((c) => c.title.toLowerCase().includes(q));
  }, [pinnedChats, searchQuery]);

  const filteredRecent = useMemo(() => {
    if (!searchQuery.trim()) return recentChats;
    const q = searchQuery.toLowerCase();
    return recentChats.filter((c) => c.title.toLowerCase().includes(q));
  }, [recentChats, searchQuery]);

  async function onRename(chatId: string) {
    const next = window.prompt(t("renamePrompt"), "");
    if (!next || !next.trim()) return;
    await renameChat({ chatId: chatId as never, title: next.trim() });
  }

  async function onDelete(chatId: string) {
    await deleteChat({ chatId: chatId as never });
    if (pathname === `/chat/${chatId}`) router.push("/chat");
    setDeleteTarget(null);
  }

  async function onTogglePin(chatId: string) {
    await togglePinMutation({ chatId: chatId as never });
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onCloseMobile}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 shrink-0 transition-all duration-300 md:static md:z-0",
          collapsed ? "w-[4.5rem]" : "w-[17rem]",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col overflow-hidden bg-card">
          {/* ── Header ── */}
          <div
            className={cn(
              "flex h-14 shrink-0 items-center px-3",
              collapsed ? "justify-center" : "gap-2",
            )}
          >
            {!collapsed && (
              <Link
                href="/chat"
                prefetch
                onClick={onCloseMobile}
                className="flex min-w-0 items-center px-1.5 py-1"
              >
                <BrandLogo className="h-6 w-6" priority />
              </Link>
            )}

            <button
              type="button"
              onClick={onCloseMobile}
              className={cn(
                "rounded-lg p-1.5 text-muted-foreground hover:bg-accent/50 md:hidden",
                !collapsed && "ml-auto",
              )}
              aria-label={t("closeSidebar")}
            >
              <X className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onToggleCollapse}
              className={cn(
                "hidden rounded-lg p-1.5 text-muted-foreground hover:bg-accent/50 md:inline-flex",
                !collapsed && "ml-auto",
              )}
              aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* ── Workspace mode tabs (Chat is the only one shipped today) ── */}
          <div className={cn("px-3 pb-2", collapsed ? "space-y-1.5" : "")}>
            {collapsed ? (
              <>
                <ModeTabIcon
                  icon={MessageSquare}
                  label={t("modes.chat")}
                  active={pathname.startsWith("/chat")}
                  href="/chat"
                  onCloseMobile={onCloseMobile}
                />
                <ModeTabIcon
                  icon={ImageIcon}
                  label={t("modes.canva")}
                  disabledTooltip={t("comingSoon")}
                />
                <ModeTabIcon
                  icon={Code2}
                  label={t("modes.code")}
                  disabledTooltip={t("comingSoon")}
                />
              </>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                <ModeTabPill
                  icon={MessageSquare}
                  label={t("modes.chat")}
                  active={pathname.startsWith("/chat")}
                  href="/chat"
                  onCloseMobile={onCloseMobile}
                />
                <ModeTabPill
                  icon={ImageIcon}
                  label={t("modes.canva")}
                  disabledTooltip={t("comingSoon")}
                />
                <ModeTabPill
                  icon={Code2}
                  label={t("modes.code")}
                  disabledTooltip={t("comingSoon")}
                />
              </div>
            )}
          </div>

          {/* ── New Chat button ── */}
          <div className={cn("px-3 pb-3", collapsed && "flex justify-center")}>
            <NewChatButton
              collapsed={collapsed}
              pathname={pathname}
              onAfterClick={onCloseMobile}
            />
          </div>

          {/* ── Search ── */}
          {!collapsed && (
            <div className="px-3 pb-3">
              <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 focus-within:ring-1 focus-within:ring-border">
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Chat list ── */}
          <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-thin">
            {(isLoading || chats === undefined) && !collapsed && (
              <div className="px-2 py-2 text-xs text-muted-foreground">
                {t("loading")}
              </div>
            )}

            {!collapsed && (
              <>
                {/* Pinned section */}
                {filteredPinned.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setPinnedOpen((v) => !v)}
                      className="flex w-full items-center gap-1.5 px-3 pb-1 pt-1 text-left"
                    >
                      <Pin className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("pinned")}
                      </span>
                      <ChevronDown
                        className={cn(
                          "ml-auto h-3 w-3 text-muted-foreground transition-transform",
                          !pinnedOpen && "-rotate-90",
                        )}
                      />
                    </button>
                    {pinnedOpen && (
                      <div className="mb-2 space-y-0.5" data-no-translate>
                        {filteredPinned.map((chat) => (
                          <ChatRow
                            key={chat.id}
                            chat={chat}
                            active={pathname === `/chat/${chat.id}`}
                            onCloseMobile={onCloseMobile}
                            onRename={onRename}
                            onDelete={(id) =>
                              setDeleteTarget({
                                id,
                                title:
                                  allChats.find((chat) => chat.id === id)?.title ??
                                  t("untitled"),
                              })
                            }
                            onTogglePin={onTogglePin}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Recent section */}
                {filteredPinned.length > 0 && filteredRecent.length > 0 && (
                  <div className="px-3 pb-1 pt-0.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("recent")}
                    </span>
                  </div>
                )}
                <div className="space-y-0.5" data-no-translate>
                  {filteredRecent.map((chat) => (
                    <ChatRow
                      key={chat.id}
                      chat={chat}
                      active={pathname === `/chat/${chat.id}`}
                      onCloseMobile={onCloseMobile}
                      onRename={onRename}
                      onDelete={(id) =>
                        setDeleteTarget({
                          id,
                          title:
                            allChats.find((chat) => chat.id === id)?.title ??
                            t("untitled"),
                        })
                      }
                      onTogglePin={onTogglePin}
                    />
                  ))}
                </div>

                {!isLoading &&
                  filteredPinned.length === 0 &&
                  filteredRecent.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      {searchQuery ? t("noMatches") : t("noChats")}
                    </div>
                  )}
              </>
            )}

            {/* Collapsed: letter avatars */}
            {collapsed && (
              <div className="space-y-0.5" data-no-translate>
                {allChats.map((chat) => (
                  <Link
                    key={chat.id}
                    href={`/chat/${chat.id}`}
                    prefetch
                    onClick={onCloseMobile}
                    title={chat.title}
                    className={cn(
                      "mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold text-muted-foreground transition hover:bg-accent/50",
                      pathname === `/chat/${chat.id}` &&
                        "bg-accent/70 text-foreground",
                    )}
                  >
                    {chat.title.slice(0, 1).toUpperCase()}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className={cn("space-y-2 px-3 pb-3", collapsed && "px-2")}>
            {collapsed ? (
              <>
                {profile?.is_admin && (
                  <Link
                    href="/admin"
                    prefetch
                    onClick={onCloseMobile}
                    className={cn(
                      "mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-accent/50 hover:text-foreground",
                      pathname === "/admin" && "bg-accent/70 text-foreground",
                    )}
                    aria-label={t("admin")}
                  >
                    <Shield className="h-4 w-4" />
                  </Link>
                )}
                <Link
                  href="/contribution"
                  prefetch
                  onClick={onCloseMobile}
                  className={cn(
                    "mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-accent/50 hover:text-foreground",
                    pathname === "/contribution" &&
                      "bg-accent/70 text-foreground",
                  )}
                  aria-label={t("community")}
                >
                  <Leaf className="h-4 w-4" />
                </Link>
                <Link
                  href="/settings"
                  prefetch
                  onClick={onCloseMobile}
                  className={cn(
                    "mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-accent/50 hover:text-foreground",
                    pathname === "/settings" && "bg-accent/70 text-foreground",
                  )}
                  aria-label={t("settings")}
                >
                  <Settings className="h-4 w-4" />
                </Link>
                <SignOutButton redirectUrl="/">
                  <button
                    type="button"
                    className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-accent/50 hover:text-foreground"
                    aria-label={t("signOut")}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </SignOutButton>
              </>
            ) : (
              <>
                {profile?.is_admin && (
                  <Link
                    href="/admin"
                    prefetch
                    onClick={onCloseMobile}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground",
                      pathname === "/admin" && "bg-primary/10 text-foreground",
                    )}
                  >
                    <Shield className="h-4 w-4" />
                    {t("admin")}
                  </Link>
                )}
                <Link
                  href="/contribution"
                  prefetch
                  onClick={onCloseMobile}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground",
                    pathname === "/contribution" &&
                      "bg-primary/10 text-foreground",
                  )}
                >
                  <Leaf className="h-4 w-4" />
                  {t("community")}
                </Link>
                <Link
                  href="/settings"
                  prefetch
                  onClick={onCloseMobile}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground",
                    pathname === "/settings" &&
                      "bg-primary/10 text-foreground",
                  )}
                >
                  <Settings className="h-4 w-4" />
                  {t("settings")}
                </Link>
                <SignOutButton redirectUrl="/">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("signOut")}
                  </button>
                </SignOutButton>
              </>
            )}
          </div>
        </div>

      </aside>

      <Dialog.Root
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/35 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[71] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] border border-border/60 bg-background p-6 shadow-2xl">
            <Dialog.Title className="text-xl font-semibold tracking-tight">
              {t("deleteDialog.title")}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("deleteDialog.bodyPrefix")}{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.title || t("deleteDialog.bodyFallback")}
              </span>
              {t("deleteDialog.bodySuffix")}
            </Dialog.Description>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-full border border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground"
                >
                  {t("deleteDialog.cancel")}
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={() => {
                  if (!deleteTarget) return;
                  void onDelete(deleteTarget.id);
                }}
                className="rounded-full bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition hover:opacity-90"
              >
                {t("deleteDialog.confirm")}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </>
  );
}

type ModeTabIcon = typeof MessageSquare;

type ModeTabBaseProps = {
  icon: ModeTabIcon;
  label: string;
  active?: boolean;
  href?: string;
  disabledTooltip?: string;
  onCloseMobile?: () => void;
};

function ModeTabPill({
  icon: Icon,
  label,
  active = false,
  href,
  disabledTooltip,
  onCloseMobile,
}: ModeTabBaseProps) {
  const baseClasses =
    "flex h-9 flex-col items-center justify-center gap-0.5 rounded-xl border px-1 text-[10px] font-medium transition-colors";
  const activeClasses =
    "border-primary/40 bg-accent text-accent-foreground";
  const idleClasses =
    "border-border/60 bg-card text-muted-foreground hover:bg-muted hover:text-foreground";
  const disabledClasses =
    "cursor-not-allowed border-border/60 bg-card text-muted-foreground/60 hover:bg-card hover:text-muted-foreground/60";

  const content = (
    <>
      <Icon className="h-3.5 w-3.5" />
      <span className="leading-none">{label}</span>
    </>
  );

  if (disabledTooltip) {
    return (
      <InstantTooltip content={disabledTooltip}>
        <button
          type="button"
          aria-disabled
          disabled
          className={cn(baseClasses, disabledClasses)}
        >
          {content}
        </button>
      </InstantTooltip>
    );
  }

  return (
    <Link
      href={href ?? "#"}
      onClick={onCloseMobile}
      className={cn(baseClasses, active ? activeClasses : idleClasses)}
    >
      {content}
    </Link>
  );
}

function ModeTabIcon({
  icon: Icon,
  label,
  active = false,
  href,
  disabledTooltip,
  onCloseMobile,
}: ModeTabBaseProps) {
  const baseClasses =
    "mx-auto flex h-9 w-9 items-center justify-center rounded-xl border transition-colors";
  const activeClasses =
    "border-primary/40 bg-accent text-accent-foreground";
  const idleClasses =
    "border-border/60 bg-card text-muted-foreground hover:bg-muted hover:text-foreground";
  const disabledClasses =
    "cursor-not-allowed border-border/60 bg-card text-muted-foreground/60 hover:bg-card hover:text-muted-foreground/60";

  if (disabledTooltip) {
    return (
      <InstantTooltip content={disabledTooltip}>
        <button
          type="button"
          aria-label={label}
          aria-disabled
          disabled
          className={cn(baseClasses, disabledClasses)}
        >
          <Icon className="h-4 w-4" />
        </button>
      </InstantTooltip>
    );
  }

  return (
    <Link
      href={href ?? "#"}
      aria-label={label}
      onClick={onCloseMobile}
      className={cn(baseClasses, active ? activeClasses : idleClasses)}
    >
      <Icon className="h-4 w-4" />
    </Link>
  );
}

function NewChatButton({
  collapsed,
  pathname,
  onAfterClick,
}: {
  collapsed: boolean;
  pathname: string | null;
  onAfterClick: () => void;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Sidebar");
  const localizedChatPath =
    locale === routing.defaultLocale ? "/chat" : `/${locale}/chat`;

  // chat-client rewrites the URL to /chat/<id> via history.replaceState after
  // a new chat is created, which Next's router never learns about. A plain
  // <Link href="/chat"> then short-circuits as "already there" and nothing
  // happens. Force a real navigation when we detect that mismatch.
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    onAfterClick();
    if (pathname?.startsWith("/chat/")) {
      e.preventDefault();
      window.location.href = localizedChatPath;
      return;
    }
    // Already on /chat (the new-chat page): refresh state so any in-memory
    // greeting/draft from the previous visit clears.
    if (pathname === "/chat") {
      e.preventDefault();
      router.refresh();
    }
  }

  if (collapsed) {
    return (
      <Link
        href="/chat"
        onClick={handleClick}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition hover:opacity-90"
        aria-label={t("newChatAria")}
      >
        <Plus className="h-4 w-4" />
      </Link>
    );
  }
  return (
    <Link
      href="/chat"
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
    >
      <Plus className="h-4 w-4" />
      {t("newChat")}
    </Link>
  );
}
