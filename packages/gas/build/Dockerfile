FROM emscripten/emsdk:4.0.17 AS builder

RUN apt-get update && \
    apt-get install -y git bison flex texinfo parallel --no-install-recommends && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ARG BRANCH=master
RUN git clone --depth 1 --branch ${BRANCH} git://sourceware.org/git/binutils-gdb.git /src

WORKDIR /src
COPY ./build.sh /src/build.sh

ARG TARGET
RUN ./build.sh ${TARGET} esm,cjs /dist

FROM scratch AS export
COPY --from=builder /dist /dist