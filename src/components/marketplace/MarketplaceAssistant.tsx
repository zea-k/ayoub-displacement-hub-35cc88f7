import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Store, Sparkles as SparkleIcon, ShoppingBag, Trash2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUserLocation } from "@/hooks/useUserLocation";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

const STORAGE_KEY = "zeetop_assistant_messages_v1";
const ASSISTANT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/marketplace-assistant`;

function loadMessages(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const SUGGESTIONS = [
  "Onyesha maduka karibu yangu",
  "Bidhaa zinazotrend leo",
  "Natafuta simu chini ya 500,000",
  "Show me popular shops",
];

export default function MarketplaceAssistant() {
  const [open, setOpen] = useState(false);
  const [initial] = useState<UIMessage[]>(() => loadMessages());
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { location, status: locStatus, request: requestLocation } = useUserLocation();

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    messages: initial,
    transport: new DefaultChatTransport({
      api: ASSISTANT_URL,
      headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "" },
      body: () => ({ location }),
    }),
  });

  // Unique assistant short ID for session and lightweight analytics
  const [assistantId] = useState(() => Math.random().toString(36).slice(2, 9).toUpperCase());

  const sparkData = useMemo(() => {
    const last = messages.slice(-12).map((m) => {
      try {
        return m.parts?.map((p: any) => (p.type === "text" ? p.text : "")).join("").length || 0;
      } catch {
        return 0;
      }
    });
    if (last.length === 0) return [2, 4, 2, 3, 5, 3, 2];
    return last;
  }, [messages]);


  // Persist on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore quota errors
    }
  }, [messages]);

  // Focus textarea on open and after streams finish
  useEffect(() => {
    if (open && status !== "streaming") {
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [open, status]);

  const handleSubmit = ({ text }: { text: string }) => {
    const value = text.trim();
    if (!value) return;
    sendMessage({ text: value });
  };

  const handleSuggestion = (text: string) => {
    sendMessage({ text });
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <>
      {/* Floating launcher */}
      <motion.button
        aria-label="Open ZEETOP assistant"
        onClick={() => setOpen((v) => !v)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-[60] h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-2xl shadow-primary/40 flex items-center justify-center"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
        {!open && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-background animate-pulse" />
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed inset-x-2 bottom-36 z-[59] sm:inset-auto sm:bottom-40 sm:right-6 sm:w-[420px] h-[min(70vh,640px)]"
          >
            {/* Premium gradient border wrapper */}
            <div className="absolute inset-0 rounded-2xl p-[1.5px] bg-gradient-to-br from-primary/60 via-primary/30 to-accent/40 pointer-events-none" />
            
            {/* Main chat container */}
            <div className="relative h-full rounded-2xl bg-card/95 backdrop-blur-xl shadow-2xl shadow-primary/30 flex flex-col overflow-hidden border border-white/10">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-gradient-to-r from-primary/8 via-accent/5 to-primary/8">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center text-primary-foreground shadow-lg">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-bold leading-tight text-foreground flex items-center gap-1.5 text-sm">
                    ZEETOP AI
                    <SparkleIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="ml-3 text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-md border border-white/6">
                    ID: <span className="font-medium text-foreground">{assistantId}</span>
                  </div>
                </div>
                <div className="text-[12px] text-muted-foreground flex items-center gap-1.5 mt-1">
                  Bilingual · Swahili & English
                  {location && <span className="ml-1 inline-flex items-center gap-0.5 text-emerald-500"><MapPin className="h-3 w-3" />nearby</span>}
                </div>
              </div>
              {!location && locStatus !== "requesting" && (
                <Button variant="ghost" size="icon-sm" onClick={requestLocation} title="Share location" className="hover:bg-primary/10">
                  <MapPin className="h-4 w-4" />
                </Button>
              )}
              {messages.length > 0 && (
                <Button variant="ghost" size="icon-sm" onClick={clearChat} title="Clear chat" className="hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Assistant stats strip */}
            <div className="px-4 py-3 border-b border-white/6 bg-gradient-to-t from-black/2 to-transparent">
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-3">
                  <div className="rounded-md bg-card/60 px-3 py-2 border border-white/6">
                    <div className="text-[10px] text-muted-foreground">Messages</div>
                    <div className="text-sm font-semibold text-foreground">{messages.length}</div>
                  </div>
                  <div className="rounded-md bg-card/60 px-3 py-2 border border-white/6">
                    <div className="text-[10px] text-muted-foreground">Responses</div>
                    <div className="text-sm font-semibold text-foreground">{messages.filter((m) => m.role === "assistant").length}</div>
                  </div>
                  <div className="flex-1 rounded-md bg-card/60 px-3 py-2 border border-white/6 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-muted-foreground">Activity</div>
                      <div className="text-sm font-semibold text-foreground">Recent activity</div>
                    </div>
                    <div className="w-28 h-8">
                      <svg viewBox="0 0 28 8" preserveAspectRatio="none" className="w-full h-full">
                        {(() => {
                          const max = Math.max(...sparkData, 1);
                          return sparkData.map((v, i) => {
                            const x = (i / (sparkData.length - 1 || 1)) * 28;
                            const y = 8 - (v / max) * 7;
                            return <circle key={i} cx={x} cy={y} r={0.9} fill="rgba(96,165,250,0.9)" />;
                          });
                        })()}
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Tip: try "Bidhaa zinazotrend"</div>
              </div>
            </div>


            {/* Conversation */}
            <Conversation className="flex-1">
              <ConversationContent className="px-3 py-4">
                {messages.length === 0 ? (
                  <ConversationEmptyState
                    icon={<Store className="h-8 w-8 text-primary" />}
                    title="Karibu ZEETOP"
                    description="Ask me to find products, nearby shops, or what's trending."
                  >
                    <div className="mt-3 grid grid-cols-1 gap-2 w-full">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSuggestion(s)}
                          className="text-left text-sm px-3 py-2 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-foreground"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </ConversationEmptyState>
                ) : (
                  messages.map((m) => (
                    <Message key={m.id} from={m.role as "user" | "assistant"}>
                      <MessageContent
                        className={cn(
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-transparent p-0 text-foreground",
                        )}
                      >
                        {m.parts.map((part, i) => {
                          if (part.type === "text") {
                            return m.role === "assistant" ? (
                              <MessageResponse key={i}>{part.text}</MessageResponse>
                            ) : (
                              <span key={i} className="whitespace-pre-wrap">{part.text}</span>
                            );
                          }
                          if (part.type?.startsWith("tool-")) {
                            const toolName = part.type.replace("tool-", "");
                            const anyPart = part as any;
                            return (
                              <details key={i} className="mt-2 text-xs rounded-md border border-border bg-muted/40 px-2 py-1 text-muted-foreground">
                                <summary className="cursor-pointer select-none">
                                  <SparkleIcon className="inline h-3 w-3 mr-1" />
                                  {toolName} · {anyPart.state}
                                </summary>
                                {anyPart.input && (
                                  <pre className="mt-1 overflow-auto text-[10px]">{JSON.stringify(anyPart.input, null, 2)}</pre>
                                )}
                              </details>
                            );
                          }
                          return null;
                        })}
                      </MessageContent>
                    </Message>
                  ))
                )}
                {status === "submitted" && (
                  <Message from="assistant">
                    <MessageContent className="bg-transparent p-0">
                      <Shimmer>Thinking...</Shimmer>
                    </MessageContent>
                  </Message>
                )}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>

            {/* Composer */}
            <div className="border-t border-white/10 bg-background/80 backdrop-blur p-2">
              <PromptInput onSubmit={handleSubmit}>
                <PromptInputTextarea
                  ref={textareaRef as any}
                  placeholder="Andika ujumbe... e.g. natafuta soda karibu"
                />
                <PromptInputFooter className="justify-end">
                  <PromptInputSubmit
                    status={status}
                    onStop={status === "streaming" ? stop : undefined}
                  />
                </PromptInputFooter>
              </PromptInput>
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
