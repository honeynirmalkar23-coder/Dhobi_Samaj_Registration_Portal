insert into public.payment_settings (id, payment_enabled)
values (1, false)
on conflict (id) do nothing;
