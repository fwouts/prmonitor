export interface CrossScriptMessenger {
  listen(callback: (message: Message) => void): void;
  send(message: Message): void;
}

export type Message =
  | {
      kind: "refresh";
    }
  | {
      kind: "reload";
    }
  | {
      kind: "restart";
    };
