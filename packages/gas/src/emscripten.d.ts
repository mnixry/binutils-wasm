export namespace Emscripten {
  export type EnvironmentType = "WEB" | "NODE" | "SHELL" | "WORKER";

  export type WebAssemblyImports = Array<{
    name: string;
    kind: string;
  }>;

  export type WebAssemblyExports = Array<{
    module: string;
    name: string;
    kind: string;
  }>;

  export interface ModuleInit {
    print(str: string): void;
    printErr(str: string): void;
    arguments: string[];
    environment: EnvironmentType;
    preInit: Array<{ (m: Module): void }>;
    preRun: Array<{ (m: Module): void }>;
    postRun: Array<{ (m: Module): void }>;
    onAbort: { (what: any): void };
    onRuntimeInitialized: { (): void };
    preinitializedWebGLContext: WebGLRenderingContext;
    noInitialRun: boolean;
    noExitRuntime: boolean;
    logReadFiles: boolean;
    filePackagePrefixURL: string;
    wasmBinary: ArrayBuffer;

    destroy(object: object): void;
    getPreloadedPackage(
      remotePackageName: string,
      remotePackageSize: number
    ): ArrayBuffer;
    instantiateWasm(
      imports: WebAssemblyImports,
      successCallback: (module: WebAssembly.Module) => void
    ): WebAssemblyExports;
    locateFile(url: string, scriptDirectory: string): string;
    onCustomMessage(event: MessageEvent): void;

    // USE_TYPED_ARRAYS == 1
    HEAP: Int32Array;
    IHEAP: Int32Array;
    FHEAP: Float64Array;

    // USE_TYPED_ARRAYS == 2
    HEAP8: Int8Array;
    HEAP16: Int16Array;
    HEAP32: Int32Array;
    HEAPU8: Uint8Array;
    HEAPU16: Uint16Array;
    HEAPU32: Uint32Array;
    HEAPF32: Float32Array;
    HEAPF64: Float64Array;
    HEAP64: BigInt64Array;
    HEAPU64: BigUint64Array;

    TOTAL_STACK: number;
    TOTAL_MEMORY: number;
    FAST_MEMORY: number;

    addOnPreRun(cb: () => void): void;
    addOnInit(cb: () => void): void;
    addOnPreMain(cb: () => void): void;
    addOnExit(cb: () => void): void;
    addOnPostRun(cb: () => void): void;

    preloadedImages: any;
    preloadedAudios: any;

    _malloc(size: number): number;
    _free(ptr: number): void;
  }

  export interface Module extends ModuleInit {
    FS: FileSystem.FS;
  }

  export namespace FileSystem {
    export interface Stats {
      dev: number;
      ino: number;
      mode: number;
      nlink: number;
      uid: number;
      gid: number;
      rdev: number;
      size: number;
      blksize: number;
      blocks: number;
      atime: Date;
      mtime: Date;
      ctime: Date;
      birthtime: Date;
    }
    export interface FSStream {}
    export interface FSNode {}
    export interface ErrnoError {}

    export interface FSType {}

    export interface FS {
      // paths
      lookupPath(
        path: string,
        opts?: { parent: boolean; follow: boolean }
      ): { path: string; node: FSNode };
      getPath(node: FSNode): string;

      // nodes
      isFile(mode: number): boolean;
      isDir(mode: number): boolean;
      isLink(mode: number): boolean;
      isChrdev(mode: number): boolean;
      isBlkdev(mode: number): boolean;
      isFIFO(mode: number): boolean;
      isSocket(mode: number): boolean;

      // devices
      major(dev: number): number;
      minor(dev: number): number;
      makede(ma: number, mi: number): number;
      registerDevice(dev: number, ops: any): void;

      // core
      syncfs(populate: boolean, callback: (e?: unknown) => void): void;
      syncfs(callback: (e?: unknown) => void, populate?: boolean): void;
      mount(type: FSType, opts: object, mountpoint: string): void;
      unmount(mountpoint: string): void;

      mkdir(path: string, mode?: number): void;
      mkdev(path: string, mode?: number, dev?: number): void;
      symlink(oldpath: string, newpath: string): void;
      rename(old_path: string, new_path: string): void;
      rmdir(path: string): void;
      readdir(path: string): string[];
      unlink(path: string): void;
      readlink(path: string): string;
      stat(path: string, dontFollow?: boolean): Stats;
      lstat(path: string): Stats;
      chmod(path: string, mode: number, dontFollow?: boolean): void;
      lchmod(path: string, mode: number): void;
      fchmod(fd: number, mode: number): void;
      chown(path: string, uid: number, gid: number, dontFollow?: boolean): void;
      lchown(path: string, uid: number, gid: number): void;
      fchown(fd: number, uid: number, gid: number): void;
      truncate(path: string, len: number): void;
      ftruncate(fd: number, len: number): void;
      utime(path: string, atime: number, mtime: number): void;
      open(
        path: string,
        flags: string,
        mode?: number,
        fd_start?: number,
        fd_end?: number
      ): FSStream;
      close(stream: FSStream): void;
      llseek(stream: FSStream, offset: number, whence: number): void;
      read(
        stream: FSStream,
        buffer: ArrayBufferView,
        offset: number,
        length: number,
        position?: number
      ): number;
      write(
        stream: FSStream,
        buffer: ArrayBufferView,
        offset: number,
        length: number,
        position?: number,
        canOwn?: boolean
      ): number;
      allocate(stream: FSStream, offset: number, length: number): void;
      mmap(
        stream: FSStream,
        buffer: ArrayBufferView,
        offset: number,
        length: number,
        position: number,
        prot: number,
        flags: number
      ): any;
      ioctl(stream: FSStream, cmd: any, arg: any): any;
      readFile(
        path: string,
        opts: { encoding: "binary"; flags?: string | undefined }
      ): Uint8Array;
      readFile(
        path: string,
        opts: { encoding: "utf8"; flags?: string | undefined }
      ): string;
      readFile(path: string, opts?: { flags?: string | undefined }): Uint8Array;
      writeFile(
        path: string,
        data: string | ArrayBufferView,
        opts?: { flags?: string | undefined }
      ): void;

      // module-level FS code
      cwd(): string;
      chdir(path: string): void;
      init(
        input: (() => number | null) | null,
        output: ((c: number | null) => void) | null,
        error: ((c: number | null) => void) | null
      ): void;

      createLazyFile(
        parent: string | FSNode,
        name: string,
        url: string,
        canRead: boolean,
        canWrite: boolean
      ): FSNode;
      createPreloadedFile(
        parent: string | FSNode,
        name: string,
        url: string,
        canRead: boolean,
        canWrite: boolean,
        onload?: () => void,
        onerror?: () => void,
        dontCreateFile?: boolean,
        canOwn?: boolean
      ): void;
      createDataFile(
        parent: string | FSNode,
        name: string,
        data: ArrayBufferView,
        canRead: boolean,
        canWrite: boolean,
        canOwn: boolean
      ): FSNode;
    }
  }

  export type ModuleFactory<T extends ModuleInit = ModuleInit> = (
    options?: Partial<T>
  ) => Promise<T & Module>;
}
