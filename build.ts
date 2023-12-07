import {parse} from "https://deno.land/std@0.202.0/flags/mod.ts"
import {denoPlugins} from "https://deno.land/x/esbuild_deno_loader@0.8.2/mod.ts"
import esbuild from 'npm:esbuild'
import autoprefixer from 'npm:autoprefixer'
import tailwindcss from 'npm:tailwindcss'
import postCssPlugin from 'npm:@deanc/esbuild-plugin-postcss'
import manifest from 'npm:esbuild-plugin-manifest'
import {clean} from 'npm:esbuild-plugin-clean'

const flagEntryPath = 'entry-path'
const flagConfigPath = 'config-path'
const flagPublicPath = 'public-path'

const flags = parse(Deno.args, {
	string: [flagEntryPath, flagConfigPath, flagPublicPath],
});

export async function build() {
	try {
		await esbuild.build({
			entryPoints: [flags[flagEntryPath]+'/scripts/main.ts'],
			entryNames: '[name]-[hash]',
			bundle: true,
			sourcemap: true,
			minify: true,
			format: "esm",
			outdir: flags[flagPublicPath] + '/scripts/',
			plugins: [
				...denoPlugins(),
				clean({
					patterns: [flags[flagPublicPath] + '/scripts/*'],
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
			entryPoints: [flags[flagEntryPath]+'/styles/main.css'],
			entryNames: '[dir]/[name]-[hash]',
			bundle: true,
			sourcemap: true,
			minify: true,
			outdir: flags[flagPublicPath] + '/styles/',
			plugins: [
				clean({
					patterns: [flags[flagPublicPath] + '/styles/*'],
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

