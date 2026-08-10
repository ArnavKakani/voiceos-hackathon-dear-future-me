/*
  # Add set_claim function for JWT claims

  1. New Functions
    - `set_claim(name text, value text)`: Function to set a claim in the current session
      - Parameters:
        - name: The name of the claim to set
        - value: The value to set for the claim
      - Returns: void
      - Security: Can be executed by anyone (needed for anonymous users)

  2. Security
    - Function is accessible to all users (including anonymous)
    - Used specifically for setting temporary claims for accomplishment deletion
*/

-- Create the function to set session claims
create or replace function public.set_claim(name text, value text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.' || name, value, true);
end;
$$;