import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/lib/auth";
import { useBranch } from "@/contexts/BranchContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  MessageCircle,
  Send,
  Hash,
  Users,
  Plus,
  Search,
  MessageSquarePlus,
  UserPlus,
} from "lucide-react";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";

type Conversation = {
  id: string;
  name: string;
  type: 'channel' | 'direct';
  scope: 'branch' | 'restaurant';
  branchId: string | null;
  restaurantId: string;
  createdBy: string;
  createdAt: string;
  participantHash: string | null;
  lastMessage?: {
    content: string;
    senderName: string;
    createdAt: string;
  };
  unreadCount: number;
};

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
};

type User = {
  id: string;
  username: string;
  fullName: string;
  role: string;
};

type Branch = {
  id: string;
  name: string;
};

export default function Chat() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { currentBranch } = useBranch();
  const { toast } = useToast();
  
  const createChannelSchema = z.object({
    name: z.string().min(2).max(50).regex(/^#[a-z0-9-]+$/, "Channel name must start with # and contain only lowercase letters, numbers, and hyphens"),
    scope: z.enum(['branch', 'restaurant']),
    branchId: z.string().optional(),
  }).refine(
    (data) => {
      if (data.scope === 'branch') {
        return data.branchId !== undefined && data.branchId !== '';
      }
      return true;
    },
    {
      message: "Branch is required for branch-scoped channels",
      path: ["branchId"],
    }
  );
  
  const createDMSchema = z.object({
    userId: z.string().min(1, "Please select a user"),
  });
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isChannelDialogOpen, setIsChannelDialogOpen] = useState(false);
  const [isDMDialogOpen, setIsDMDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  type ChannelFormData = z.infer<typeof createChannelSchema>;
  type DMFormData = z.infer<typeof createDMSchema>;

  const channelForm = useForm<ChannelFormData>({
    resolver: zodResolver(createChannelSchema),
    defaultValues: {
      name: "#",
      scope: "restaurant",
      branchId: currentBranch?.id || undefined,
    },
  });

  const dmForm = useForm<DMFormData>({
    resolver: zodResolver(createDMSchema),
    defaultValues: {
      userId: "",
    },
  });

  // Fetch conversations with branch filtering
  const { data: conversations, isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/chat/conversations', currentBranch?.id],
    queryFn: async () => {
      const url = currentBranch?.id 
        ? `/api/chat/conversations?branchId=${currentBranch.id}`
        : '/api/chat/conversations';
      const response = await fetch(url, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return response.json();
    },
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/chat/conversations', selectedConversation, 'messages'],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const response = await fetch(`/api/chat/conversations/${selectedConversation}/messages`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    enabled: !!selectedConversation,
  });

  // Fetch users for DM creation
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/chat/users'],
  });

  // Fetch branches for channel creation
  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['/api/branches'],
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation && messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.senderId !== user?.id) {
        markAsRead.mutate({ 
          conversationId: selectedConversation, 
          lastReadMessageId: lastMessage.id 
        });
      }
    }
  }, [selectedConversation, messages, user?.id]);

  const createChannelMutation = useMutation({
    mutationFn: async (data: ChannelFormData) => {
      return await apiRequest('POST', '/api/chat/channels', {
        name: data.name,
        scope: data.scope,
        branchId: data.scope === 'branch' ? data.branchId : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      setIsChannelDialogOpen(false);
      channelForm.reset();
      toast({
        title: t.success || "Success",
        description: t.channelCreatedDesc || "Channel created successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: t.error || "Error",
        description: t.failedToCreateChannel || "Failed to create channel",
      });
    },
  });

  const createDMMutation = useMutation({
    mutationFn: async (data: DMFormData) => {
      return await apiRequest('POST', '/api/chat/direct', {
        otherUserId: data.userId,
      });
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      setIsDMDialogOpen(false);
      dmForm.reset();
      // Auto-select the new conversation
      setSelectedConversation(response.id);
      toast({
        title: t.success || "Success",
        description: t.directMessageStartedDesc || "Direct message started",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: t.error || "Error",
        description: t.failedToStartDirectMessage || "Failed to start direct message",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { conversationId: string; content: string }) => {
      return await apiRequest('POST', `/api/chat/conversations/${data.conversationId}/messages`, {
        content: data.content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', selectedConversation, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      setMessageContent("");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: t.error || "Error",
        description: t.failedToSendMessage || "Failed to send message",
      });
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (data: { conversationId: string; lastReadMessageId: string }) => {
      return await apiRequest('POST', `/api/chat/conversations/${data.conversationId}/read`, {
        lastReadMessageId: data.lastReadMessageId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
    },
  });

  const handleSendMessage = () => {
    if (!selectedConversation || !messageContent.trim()) return;

    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      content: messageContent.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM dd, HH:mm');
    }
  };

  const getConversationDisplayName = (conv: Conversation) => {
    if (conv.type === 'channel') {
      return conv.name;
    }
    // For DMs, the name will be the other participant's name
    return conv.name;
  };

  // Filter conversations based on search and branch
  const filteredConversations = conversations?.filter(conv => {
    const displayName = getConversationDisplayName(conv);
    const matchesSearch = displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? true;
    const matchesBranch = currentBranch?.id
      ? (conv.scope === 'restaurant' || conv.branchId === currentBranch.id)
      : true;
    return matchesSearch && matchesBranch;
  }) || [];

  const selectedConv = conversations?.find(c => c.id === selectedConversation);

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 p-4">
      {/* Left: Conversation List */}
      <Card className="w-80 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {t.teamChat}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsChannelDialogOpen(true)}
              data-testid="button-new-channel"
            >
              <Hash className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsDMDialogOpen(true)}
              data-testid="button-new-dm"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 p-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={(t as any).searchConversations || "Search conversations..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              data-testid="input-search-conversations"
            />
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {conversationsLoading && (
                <div className="text-center text-sm text-muted-foreground py-8">
                  {t.loading || "Loading..."}
                </div>
              )}

              {!conversationsLoading && filteredConversations.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">
                  {(t as any).noConversationsYet || "No conversations yet"}
                </div>
              )}

              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`w-full p-3 rounded-lg text-left transition-colors hover-elevate active-elevate-2 ${
                    selectedConversation === conv.id ? 'bg-accent' : ''
                  }`}
                  data-testid={`button-conversation-${conv.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {conv.type === 'channel' ? (
                        <Hash className="h-4 w-4 flex-shrink-0" />
                      ) : (
                        <Users className="h-4 w-4 flex-shrink-0" />
                      )}
                      <span className="font-medium truncate">
                        {getConversationDisplayName(conv)}
                      </span>
                    </div>
                    {conv.unreadCount > 0 && (
                      <Badge variant="default" className="flex-shrink-0" data-testid={`badge-unread-${conv.id}`}>
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <div className="mt-1 text-xs text-muted-foreground truncate">
                      <span className="font-medium">{conv.lastMessage.senderName}:</span>{' '}
                      {conv.lastMessage.content}
                    </div>
                  )}
                  {conv.lastMessage && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true })}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Center: Messages */}
      <Card className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="flex items-center gap-2">
                {selectedConv.type === 'channel' ? (
                  <Hash className="h-5 w-5" />
                ) : (
                  <Users className="h-5 w-5" />
                )}
                <div>
                  <CardTitle className="text-xl">
                    {getConversationDisplayName(selectedConv)}
                  </CardTitle>
                  {selectedConv.type === 'channel' && (
                    <p className="text-xs text-muted-foreground">
                      {selectedConv.scope === 'branch' ? ((t as any).branchChannel || 'Branch Channel') : ((t as any).restaurantWide || 'Restaurant-wide')}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-4">
                {messagesLoading && (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    {t.loading || "Loading..."}
                  </div>
                )}

                {!messagesLoading && messages && messages.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    {t.noMessages || "No messages yet. Start the conversation!"}
                  </div>
                )}

                <div className="space-y-4">
                  {messages?.map((msg) => {
                    const isOwnMessage = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                        data-testid={`message-${msg.id}`}
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback>
                            {msg.senderName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{msg.senderName}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatMessageTime(msg.createdAt)}
                            </span>
                          </div>
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              isOwnMessage
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <Separator />

              <div className="p-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder={t.typeMessage || "Type a message..."}
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="resize-none min-h-[60px]"
                    data-testid="input-message"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageContent.trim() || sendMessageMutation.isPending}
                    size="icon"
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t.selectConversation || "Select a conversation to start chatting"}</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Create Channel Dialog */}
      <Dialog open={isChannelDialogOpen} onOpenChange={setIsChannelDialogOpen}>
        <DialogContent data-testid="dialog-new-channel">
          <DialogHeader>
            <DialogTitle>{t.createChannel || "Create Channel"}</DialogTitle>
            <DialogDescription>
              {(t as any).createChannelDesc || "Create a new channel for team communication"}
            </DialogDescription>
          </DialogHeader>
          <Form {...channelForm}>
            <form onSubmit={channelForm.handleSubmit((data) => createChannelMutation.mutate(data))} className="space-y-4">
              <FormField
                control={channelForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{(t as any).channelName || "Channel Name"}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="#general" data-testid="input-channel-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={channelForm.control}
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{(t as any).scope || "Scope"}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-channel-scope">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="restaurant">{(t as any).restaurantWide || "Restaurant-wide"}</SelectItem>
                        <SelectItem value="branch">{(t as any).branchOnly || "Branch only"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={channelForm.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem className={channelForm.watch('scope') === 'restaurant' ? 'hidden' : ''}>
                    <FormLabel>{t.branch}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-branch">
                          <SelectValue placeholder={(t as any).selectBranch || "Select branch..."} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches?.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={createChannelMutation.isPending} data-testid="button-create-channel">
                  {createChannelMutation.isPending ? (t.creating || "Creating...") : (t.create || "Create")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Create DM Dialog */}
      <Dialog open={isDMDialogOpen} onOpenChange={setIsDMDialogOpen}>
        <DialogContent data-testid="dialog-new-dm">
          <DialogHeader>
            <DialogTitle>{(t as any).newDirectMessage || "New Direct Message"}</DialogTitle>
            <DialogDescription>
              {(t as any).newDirectMessageDesc || "Start a direct conversation with a team member"}
            </DialogDescription>
          </DialogHeader>
          <Form {...dmForm}>
            <form onSubmit={dmForm.handleSubmit((data) => createDMMutation.mutate(data))} className="space-y-4">
              <FormField
                control={dmForm.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.selectUser || "Select User"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-user">
                          <SelectValue placeholder={(t as any).chooseUser || "Choose a user..."} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users?.filter(u => u.id !== user?.id).map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.fullName} (@{u.username})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={createDMMutation.isPending} data-testid="button-create-dm">
                  {createDMMutation.isPending ? ((t as any).starting || "Starting...") : ((t as any).startChat || "Start Chat")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
