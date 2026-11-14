#!/usr/bin/env node
import { cli } from '@presentation/cli/index'

process.argv.push('--watch')
void cli()
