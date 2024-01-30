#!/bin/bash
set -xe -o pipefail

targets=$1
build_type=$2
output_dir=$3
if [ -z "$targets"] || [-z "$build_type"] || [ -z "$output_dir"]; then
    echo "Usage: $0 <target> <build_type> <output_dir>"
    echo "  target: processor target (e.g. riscv64-linux-gnu)"
    echo "          you can specify multiple targets by separating them with commas"
    echo "  build_type: esm or cjs"
    exit 1
fi
for type in $(echo "$build_type" | tr "," "$IFS"); do
    if [ "$type" != "esm" ] && [ "$type" != "cjs" ]; then
        echo "Invalid build type: $type"
        exit 1
    fi
done

if [ ! -f "./configure" ]; then
    echo "Please run this script from the root of the binutils source tree"
    exit 1
fi
source_dir=$(pwd)

if [ ! -d "$output_dir" ]; then
    mkdir -p "$output_dir"
    output_dir=$(realpath "$output_dir")
fi

if command -v parallel --version && [ -z "$IN_PARALLEL" ]; then
    script_file=$(realpath "$0")
    export IN_PARALLEL=1
    exec env IN_PARALLEL=1 parallel \
        --use-cpus-instead-of-cores \
        --tagstring '[{1}.{2}]' \
        --halt soon,fail=1 \
        --line-buffer \
        --verbose \
        "$script_file" '{1}' '{2}' "$output_dir" \
        ::: $(echo "$targets" | tr "," "$IFS") \
        ::: $(echo "$build_type" | tr "," "$IFS")
fi

target_paths=(
    "gas/as-new"
)

common_configure_flags=(
    "--enable-default-execstack=no"
    "--enable-deterministic-archives"
    "--enable-ld=default"
    "--enable-new-dtags"
    "--disable-doc"
    "--disable-gprof"
    "--disable-nls"
    "--disable-binutils"
    "--disable-ld"
    "--disable-gdb"
    "--disable-gdbserver"
    "--disable-libdecnumber"
    "--disable-readline"
    "--disable-sim"
    "--disable-werror"
    "--host=wasm32"
)

sed -i '/^development=/s/true/false/' bfd/development.sh

function build_binutils() {
    build_type=$1
    build_target=$2

    emconfigure "$source_dir/configure" --target="$build_target" "${common_configure_flags[@]}"

    ldflags="-sMODULARIZE=1 -sFORCE_FILESYSTEM=1 -sEXPORTED_RUNTIME_METHODS=FS"
    if [ "$build_type" = "esm" ]; then
        ldflags="$ldflags -sEXPORT_ES6=1"
    fi

    emmake make -O \
      "CFLAGS=-DHAVE_PSIGNAL=1 -DELIDE_CODE -Os" \
      "LDFLAGS=$ldflags"

    for path in "${target_paths[@]}"; do
        exe_name=$(basename $path)
        install_path="$output_dir/$build_type"
        sed -i "s/\"$exe_name.wasm\"/\"$build_target.wasm\"/g" "$path"
        install -D "$path" "$install_path/$build_target.js"
        install -D "$path.wasm" "$install_path/$build_target.wasm"
    done
}

for target in $(echo "$targets" | tr "," "$IFS"); do
    for type in $(echo "$build_type" | tr "," "$IFS"); do
        work_dir=$(mktemp -d -t "gas.$target.$type.XXXXXX")
        (cd "$work_dir" && build_binutils "$type" "$target")
    done
done