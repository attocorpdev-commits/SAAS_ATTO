-- Enable Row Level Security
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.templates ENABLE ROW LEVEL SECURITY;

-- Users Table (Extended from Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free', -- free, pro, business
  evolution_api_key TEXT,
  evolution_instance_id TEXT,
  webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts Table
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  tags TEXT[], -- array of tags
  status TEXT DEFAULT 'active', -- active, inactive, blocked
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Templates Table
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  variables JSONB, -- store variable names used
  category TEXT DEFAULT 'marketing', -- marketing, support, transactional
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  template_id UUID REFERENCES public.templates ON DELETE SET NULL,
  status TEXT DEFAULT 'draft', -- draft, scheduled, processing, completed, paused
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts ON DELETE SET NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, sent, delivered, read, failed
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage their own contacts" ON public.contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own templates" ON public.templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own campaigns" ON public.campaigns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own messages" ON public.messages FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND user_id = auth.uid()));

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RPC Function to increment campaign sent count
CREATE OR REPLACE FUNCTION public.increment_campaign_sent(camp_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.campaigns
  SET sent_count = sent_count + 1
  WHERE id = camp_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
