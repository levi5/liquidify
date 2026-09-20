#!/usr/bin/env node
process.argv.push('--watch')
void require('./index').cli()
