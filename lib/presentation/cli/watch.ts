#!/usr/bin/env node
import { cli } from './index'

process.argv.push('--watch')
void cli()
