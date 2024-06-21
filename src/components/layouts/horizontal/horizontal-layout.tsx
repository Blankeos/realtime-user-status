import { FlowProps } from 'solid-js';

type HorizontalLayoutProps = {};

export default function HorizontalLayout(props: FlowProps<HorizontalLayoutProps>) {
  return (
    <div class="flex h-screen">
      {/* <HorizontalSidebar /> */}
      <main class="flex-grow">{props.children}</main>
    </div>
  );
}
