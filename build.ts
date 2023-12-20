import {parse} from "https://deno.land/std@0.202.0/flags/mod.ts"
import {denoPlugins} from "https://deno.land/x/esbuild_deno_loader@0.8.2/mod.ts"
import esbuild from 'npm:esbuild'
import autoprefixer from 'npm:autoprefixer'
import tailwindcss from 'npm:tailwindcss'
import postCssPlugin from 'npm:@deanc/esbuild-plugin-postcss'
import manifest from 'npm:esbuild-plugin-manifest'
import {clean} from 'npm:esbuild-plugin-clean'

const flagRootPath = 'root-path'
const flagConfigPath = 'config-path'
const flagOutputPath = 'output-path'

const flags = parse(Deno.args, {
	string: [flagRootPath, flagConfigPath, flagOutputPath],
});

export async function build() {
	try {
		await esbuild.build({
			entryPoints: [flags[flagRootPath]+'/scripts/main.ts'],
			entryNames: '[name]-[hash]',
			bundle: true,
			sourcemap: true,
			minify: true,
			format: "esm",
			outdir: flags[flagOutputPath] + '/scripts/',
			plugins: [
				...denoPlugins(),
				clean({
					patterns: [flags[flagOutputPath] + '/scripts/*'],
				}),
				manifest(),
			],
		})
		console.log('<scripts:success>')
	} catch(e) {
		console.log('<scripts:fail>')
		console.log(e)
	}
	
	try {
		await esbuild.build({
			entryPoints: [flags[flagRootPath]+'/styles/main.css'],
			entryNames: '[dir]/[name]-[hash]',
			bundle: true,
			sourcemap: true,
			minify: true,
			outdir: flags[flagOutputPath] + '/styles/',
			plugins: [
				clean({
					patterns: [flags[flagOutputPath] + '/styles/*'],
				}),
				manifest(),
				postCssPlugin({
					plugins: [
						autoprefixer,
						tailwindcss(flags[flagConfigPath]  + '/tailwind.config.ts'),
					],
				}),
			],
		})
		console.log('<styles:success>')
	} catch(e) {
		console.log('<styles:fail>')
		console.log(e)
	}
}

