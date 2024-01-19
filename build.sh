#!/bin/bash -xve

target=$1
if [ -z "$target" ]; then
    echo "Usage: $0 <target>"
    echo "  target: processor target (e.g. riscv64-linux-gnu)"
    exit 1
fi

src_dir="binutils"
build_dir_base=$(realpath -m "build")

target_paths=(
    "binutils/addr2line"
    "binutils/ar"
    "binutils/cxxfilt"
    "binutils/elfedit"
    "binutils/nm-new"
    "binutils/objcopy"
    "binutils/objdump"
    "binutils/ranlib"
    "binutils/readelf"
    "binutils/size"
    "binutils/strings"
    "binutils/strip-new"
    "gas/as-new"
    "gprof/gprof"
    "ld/ld-new"
)

common_configure_flags=(
    "--disable-doc"
    "--disable-nls"
    "--disable-gdb"
    "--disable-gdbserver"
    "--disable-libdecnumber"
    "--disable-readline"
    "--disable-sim"
    "--host=wasm32"
    "--target=${target}"
)

function build_binutils() {
    build_type=$1
    build_dir=$(realpath -m "$build_dir_base/$build_type")

    git clean -fdx
    git reset --hard HEAD
    find . -name 'config.cache' -delete

    emconfigure ./configure "${common_configure_flags[@]}"

    ldflags="-sMODULARIZE=1 -sFORCE_FILESYSTEM=1 -sEXPORTED_RUNTIME_METHODS=FS"
    if [ "$build_type" = "esm" ]; then
        ldflags="${ldflags} -sEXPORT_ES6=1"
    fi

    emmake make -j$(nproc) \
      "CFLAGS=-DHAVE_PSIGNAL=1 -DELIDE_CODE -Oz" \
      "LDFLAGS=$ldflags"

    mkdir -p "${build_dir}"
    for path in "${target_paths[@]}"; do
        cp "${path}" "${build_dir}/$(basename "${path}").js"
        cp "${path}.wasm" "${build_dir}/$(basename "${path}").wasm"
    done

    return 0
}

build_binutils cjs
build_binutils esm

echo "dir=$build_dir_base" >> $GITHUB_OUTPUT