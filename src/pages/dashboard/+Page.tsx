import ProtectedRoute from '@/components/common/protected-route';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useClientSize } from '@/hooks/use-client-size';
import { useWindowSize } from '@/hooks/use-window-size';
import { trpcClient, trpcWSClient } from '@/lib/trpc-client';
import { UserStatus } from '@/server/db/enums';
import { useAuthContext } from '@/stores/auth.context';
import { formatElapsedSMHD } from '@/utils/format-relative-time';
import { DropdownMenu } from '@kobalte/core/dropdown-menu';
import { createMutation, createQuery, useQueryClient } from '@tanstack/solid-query';
import { createSignal, For, Match, onMount, Show, Switch, VoidProps } from 'solid-js';
import { toast } from 'solid-sonner';

import { produce } from 'solid-js/store';

export default function DashboardPage() {
  const { user } = useAuthContext();

  const queryClient = useQueryClient();

  const [avatarURL, setAvatarURL] = createSignal('');
  const { height, width } = useWindowSize();

  const { height: textAreaHeight, width: textAreaWidth, clientRef: textAreaRef } = useClientSize();

  const usersQuery = createQuery(() => ({
    queryKey: ['users'],
    queryFn: async () => {
      return await trpcClient.users.allUsers.query();
    },
  }));

  const changeAvatarURLMutation = createMutation(() => ({
    mutationKey: ['change-avatar-url'],
    mutationFn: async (url: string) => {
      return await trpcClient.users.changeAvatarURL.mutate({ url });
    },
    onSuccess: () => {
      toast.success('Avatar URL updated!');
      usersQuery.refetch();
    },
  }));

  onMount(() => {
    trpcWSClient.users.onChangeStatus.subscribe({} as any, {
      onData: (value) => {
        queryClient.setQueryData(
          ['users'],
          produce((_usersData: typeof usersQuery.data) => {
            _usersData?.forEach((_user) => {
              if (_user.id === value?.id) {
                _user.status = value.status;
                _user.lastUpdatedStatusTimestamp = value.lastUpdatedStatusTimestamp;
              }
            });
          })
        );

        console.log('[ws] onData', value);
      },
      onError: (error) => {
        console.log('[ws] error', error);
      },
      onStarted: () => {
        console.log('Started subscribing to onChangeStatus');
      },
      onStopped: () => {
        console.log('Stopped subscribing to onChangeStatus');
      },
      onComplete() {
        console.log('Completed subscribing to onChangeStatus');
      },
    });
  });

  return (
    <ProtectedRoute>
      <div class="flex h-full flex-grow flex-col items-center justify-center gap-y-4 py-8">
        <div class="flex w-full flex-col items-center rounded-xl p-5">
          <h1>Hello, {user()?.username}</h1>
          <div class="flex w-full flex-col items-center gap-y-1">
            <input
              class="w-full flex-grow border-b text-center text-sm text-neutral-500 focus:outline-none"
              placeholder='Avatar URL (e.g. "https://example.com/avatar.png")'
              onInput={(e) => setAvatarURL(e.currentTarget.value)}
            />
            <button
              class="text-sm text-neutral-600"
              onClick={() => {
                changeAvatarURLMutation.mutate(avatarURL());
                setAvatarURL('');
              }}
            >
              🏞️ Save
            </button>
          </div>
        </div>
        <div class="flex w-full flex-col items-center gap-y-5">
          <h1 class="font-semibold">Users</h1>

          <div class="flex w-full max-w-sm flex-col items-center gap-y-3">
            <For each={usersQuery.data}>
              {(user) => (
                <UserBlock
                  id={user.id!}
                  name={user.username!}
                  image={user.avatarURL!}
                  status={user.status}
                  lastUpdatedStatus={user.lastUpdatedStatusTimestamp}
                />
              )}
            </For>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

type UserBlockProps = {
  id: string;
  name: string;
  image: string;
  status: UserStatus;
  lastUpdatedStatus: string;
};

function UserBlock(props: VoidProps<UserBlockProps>) {
  const { user } = useAuthContext();

  const queryClient = useQueryClient();

  const changeStatusMutation = createMutation(() => ({
    mutationKey: ['changeStatus'],
    mutationFn: async (status: UserStatus) => {
      return await trpcClient.users.changeStatus.mutate({ status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['users'],
      });
    },
  }));

  const [elapsedStatusUpdated, setElapsedStatusUpdated] = createSignal(
    formatElapsedSMHD(props.lastUpdatedStatus)
  );
  setInterval(() => {
    setElapsedStatusUpdated(formatElapsedSMHD(props.lastUpdatedStatus));
  }, 700);

  return (
    <div class="flex w-full gap-x-2 rounded-xl border border-neutral-200 bg-neutral-100 px-5 py-2">
      <div
        class="h-12 w-12 flex-shrink-0 rounded-full"
        style={{
          'background-position': 'center',
          'background-size': 'cover',
          'background-image': `url(${props.image ?? 'https://thicc-uwu.mywaifulist.moe/waifus/satoru-gojo-sorcery-fight/bOnNB0cwHheCCRGzjHLSolqabo41HxX9Wv33kfW7.jpg?class=thumbnail'} )`,
        }}
      />

      <div class="flex flex-col items-start justify-center">
        <p>{props.name}</p>

        <div class="flex items-center gap-x-1 text-xs text-neutral-400">
          <StatusBadge status={props.status} />
          <span>{elapsedStatusUpdated()}</span>
        </div>
      </div>

      <div class="flex-1" />

      <Show when={props.id === user()?.id}>
        <DropdownMenu>
          <DropdownMenuTrigger class="text-sm text-neutral-500">Edit</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
            <For
              each={[
                {
                  name: 'Offline',
                  value: UserStatus.Offline,
                },
                {
                  name: 'Online',
                  value: UserStatus.Online,
                },
                {
                  name: 'Busy',
                  value: UserStatus.Busy,
                },
                {
                  name: 'In Call',
                  value: UserStatus.InCall,
                },
              ]}
            >
              {(option) => (
                <DropdownMenuItem
                  onClick={() => {
                    changeStatusMutation.mutate(option.value);
                  }}
                >
                  {option.name}
                </DropdownMenuItem>
              )}
            </For>
          </DropdownMenuContent>
        </DropdownMenu>
      </Show>
    </div>
  );
}

function StatusBadge(props: VoidProps<{ status: UserStatus }>) {
  return (
    <>
      <Switch>
        <Match when={props.status === UserStatus.Offline}>
          <span class="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-neutral-300" />
          Offline
        </Match>
        <Match when={props.status === UserStatus.Online}>
          <span class="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />
          Online
        </Match>
        <Match when={props.status === UserStatus.Busy}>
          <span class="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-yellow-500" />
          Busy
        </Match>
        <Match when={props.status === UserStatus.InCall}>
          <span class="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
          In a Call
        </Match>
      </Switch>
    </>
  );
}
