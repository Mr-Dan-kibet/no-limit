/**
 * One-time account setup for No Limit.
 *
 *   npm run seed:user
 *
 * Prompts for an email + password and creates the account via the Supabase
 * Admin API. Re-running it on an existing account resets that password.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (or the environment).
 * The service role key bypasses RLS — never expose it to the browser and
 * never commit it.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')

function loadEnvLocal() {
  try {
    const raw = readFileSync(join(rootDir, '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
      if (!match) continue
      const [, key, value = ''] = match
      if (!process.env[key]) {
        process.env[key] = value.trim().replace(/^["']|["']$/g, '')
      }
    }
  } catch {
    // No .env.local — fall back to the ambient environment.
  }
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

function askSecret(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
  return new Promise((resolve) => {
    const onKeypress = () => {
      // Redraw the prompt without echoing the typed characters.
      rl.output.write(`\x1b[2K\r${question}`)
    }
    rl.input.on('data', onKeypress)
    rl.question(question, (answer) => {
      rl.input.off('data', onKeypress)
      rl.close()
      process.stdout.write('\n')
      resolve(answer.trim())
    })
  })
}

async function main() {
  loadEnvLocal()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.error(
      '\nMissing config. Add both of these to .env.local:\n' +
      '  NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co\n' +
      '  SUPABASE_SERVICE_ROLE_KEY=<service role key from Supabase → Settings → API>\n'
    )
    process.exit(1)
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const email = await ask('Email: ')
  if (!email.includes('@')) {
    console.error('That does not look like an email address.')
    process.exit(1)
  }

  const password = await askSecret('Password: ')
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.')
    process.exit(1)
  }

  const confirm = await askSecret('Confirm password: ')
  if (password !== confirm) {
    console.error('Passwords do not match.')
    process.exit(1)
  }

  const { data: existing, error: listError } = await admin.auth.admin.listUsers()
  if (listError) {
    console.error(`Could not reach Supabase: ${listError.message}`)
    process.exit(1)
  }

  const match = existing.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())

  if (match) {
    const { error } = await admin.auth.admin.updateUserById(match.id, { password })
    if (error) {
      console.error(`Could not update the password: ${error.message}`)
      process.exit(1)
    }
    console.log(`\nAccount already existed — password reset for ${email}.`)
    return
  }

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    console.error(`Could not create the account: ${error.message}`)
    process.exit(1)
  }

  console.log(`\nAccount created for ${email}. Sign in at /login.`)
}

main()
