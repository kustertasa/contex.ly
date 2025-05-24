declare namespace chrome {
  export namespace runtime {
    export const onInstalled: {
      addListener: (callback: () => void) => void;
    };
    export const onMessage: {
      addListener: (callback: (
        message: any,
        sender: any,
        sendResponse: (response?: any) => void
      ) => void) => void;
    };
  }

  export namespace contextMenus {
    export function create(createProperties: {
      id: string;
      title: string;
      contexts: string[];
    }): void;

    export const onClicked: {
      addListener: (callback: (
        info: {
          menuItemId: string;
          selectionText?: string;
        },
        tab?: {
          id?: number;
        }
      ) => void) => void;
    };
  }

  export namespace tabs {
    export function sendMessage(
      tabId: number,
      message: any
    ): Promise<any>;
  }

  export namespace storage {
    export const sync: {
      get: (keys: string | string[] | null) => Promise<{ [key: string]: any }>;
      set: (items: { [key: string]: any }) => Promise<void>;
      remove: (keys: string | string[]) => Promise<void>;
    };
  }
} 