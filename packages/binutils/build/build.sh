#!/bin/bash
set -xe -o pipefail

output_dir=$1
if [ -z "$output_dir" ]; then
    echo "Usage: $0 <output_dir>"
    exit 1
fi

if [ ! -f "./configure" ]; then
    echo "Please run this script from the root of the binutils source tree"
    exit 1
fi
source_dir=$(pwd)

if [ ! -d "$output_dir" ]; then
    mkdir -p "$output_dir"
    output_dir=$(realpath "$output_dir")
fi

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
)

common_configure_flags=(
    "--enable-default-execstack=no"
    "--enable-deterministic-archives"
    "--enable-ld=default"
    "--enable-new-dtags"
    "--disable-doc"
    "--disable-gprof"
    "--disable-nls"
    "--disable-gas"
    "--disable-ld"
    "--disable-gdb"
    "--disable-gdbserver"
    "--disable-libdecnumber"
    "--disable-readline"
    "--disable-sim"
    "--disable-werror"
    "--host=wasm32"
    "--enable-targets=all"
)

sed -i '/^development=/s/true/false/' bfd/development.sh

function build_binutils() {
    build_type=$1

    emconfigure "$source_dir/configure" "${common_configure_flags[@]}"

    ldflags="-sMODULARIZE=1 -sFORCE_FILESYSTEM=1 -sEXPORTED_RUNTIME_METHODS=FS -sSINGLE_FILE=1"
    if [ "$build_type" = "esm" ]; then
        ldflags="$ldflags -sEXPORT_ES6=1"
    fi

    emmake make -O -j$(nproc) \
      "CFLAGS=-DHAVE_PSIGNAL=1 -DELIDE_CODE -Os" \
      "LDFLAGS=$ldflags"

    for path in "${target_paths[@]}"; do
        exe_name=$(basename $path | sed 's/-new$//')
        install_path="$output_dir/$build_type"
        install -D "$path" "$install_path/$exe_name.js"
    done
}

for type in "esm" "cjs"; do
    work_dir=$(mktemp -d -t "binutils.$type.XXXXXX")
    (cd "$work_dir" && build_binutils "$type")
done