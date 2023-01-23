import json from 'rollup-plugin-json'
import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import serve from 'rollup-plugin-serve'
// import { terser } from "rollup-plugin-terser";
// import copy from 'rollup-plugin-copy';
// import livereload from 'rollup-plugin-livereload' 


export default {
    input: 'src/index.js',
    output: {
        file: 'dist/index.js',
        format: 'cjs'
    },
    plugins: [
        nodeResolve({
            jsnext: true,
            main: true,
            browser: true,
            preferBuiltins: true
        }),
        commonjs({
            esmExternals: true
        }),
        json(),
        babel({
            exclude: 'node_modules/**',
        }),
        serve({
            historyApiFallback: true,
            contentBase: ['src', 'dist', 'static'],
        }),
        // terser(),
        // livereload()
    ]
};