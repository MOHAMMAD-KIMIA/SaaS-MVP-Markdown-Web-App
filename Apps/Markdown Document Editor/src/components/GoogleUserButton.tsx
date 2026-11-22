import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { Button } from '../app/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../app/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../app/components/ui/dropdown-menu';
import { HardDrive, LogIn, LogOut, Cloud, Calendar, FolderOpen, ChevronDown } from 'lucide-react';
import { openGooglePicker } from '../lib/picker/pickerService';
import { getDriveFileContent } from '../lib/drive/driveService';
import { useDocumentStore } from '../stores/documentStore';
import { toast } from 'sonner';

export function GoogleUserButton() {
  const { user, accessToken, signIn, signOutUser, loading, initAuth } = useAuthStore();
  const { openDriveModal, openCalendarModal } = useUIStore();
  const { createDocument } = useDocumentStore();

  useEffect(() => {
    const unsub = initAuth();
    return () => unsub();
  }, []);

  const handleLaunchPicker = async () => {
    if (!accessToken) {
      openDriveModal();
      return;
    }
    try {
      await openGooglePicker(accessToken, async (pickedFile) => {
        try {
          const content = await getDriveFileContent(accessToken, pickedFile.id);
          const docTitle = pickedFile.name.replace(/\.(md|txt|markdown)$/i, '');
          createDocument(docTitle, content);
          toast.success(`Imported "${pickedFile.name}" via Google Picker!`);
        } catch (err: any) {
          console.error('Failed to read content:', err);
          toast.error('Failed to read file content from Google Drive');
        }
      });
    } catch (err: any) {
      console.error('Picker error:', err);
      toast.error(err.message || 'Failed to open Google Picker');
    }
  };

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled className="h-8 w-8 p-0">
        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </Button>
    );
  }

  if (!user) {
    return (
      <div className="inline-flex items-center rounded-md border border-primary/20 bg-primary text-primary-foreground shadow-xs">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signIn()}
          className="h-8 gap-1.5 px-2.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground rounded-r-none"
          title="Sign in with Google"
        >
          <LogIn className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign In</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-6 p-0 text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground border-l border-primary-foreground/20 rounded-l-none"
              aria-label="Google Workspace tools"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => openDriveModal()} className="cursor-pointer gap-2">
              <HardDrive className="h-4 w-4 text-blue-500" />
              <span>Google Drive</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openCalendarModal()} className="cursor-pointer gap-2">
              <Calendar className="h-4 w-4 text-emerald-500" />
              <span>Google Calendar</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signIn()} className="cursor-pointer gap-2">
              <LogIn className="h-4 w-4 text-primary" />
              <span>Sign in with Google</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
            <Avatar className="h-7 w-7 border border-border">
              {user.photoURL ? (
                <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />
              ) : null}
              <AvatarFallback className="text-[11px] font-semibold bg-primary/10 text-primary">
                {user.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'US'}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
              <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLaunchPicker} className="cursor-pointer gap-2">
            <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Google Picker UI</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={openCalendarModal} className="cursor-pointer gap-2">
            <Calendar className="h-4 w-4 text-emerald-500" />
            <span>Google Calendar</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={openDriveModal} className="cursor-pointer gap-2">
            <HardDrive className="h-4 w-4 text-blue-500" />
            <span>Google Drive Files</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 cursor-default text-xs text-muted-foreground">
            <Cloud className="h-4 w-4 text-emerald-500" />
            <span>Firebase Cloud Sync Active</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOutUser} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
