-- Create participants table for user registrations and game data
CREATE TABLE public.participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  device_id VARCHAR(100) NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  country_code VARCHAR(10),
  address TEXT,
  box_selected INTEGER,
  reward_won VARCHAR(255),
  amount_won INTEGER DEFAULT 0,
  registration_complete BOOLEAN DEFAULT false,
  bank_linked BOOLEAN DEFAULT false,
  kyc_complete BOOLEAN DEFAULT false,
  withdrawal_status VARCHAR(20) DEFAULT 'none' CHECK (withdrawal_status IN ('pending', 'approved', 'rejected', 'none')),
  date_used TIMESTAMP WITH TIME ZONE DEFAULT now(),
  date_registered TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(code, device_id)
);

-- Create participation codes table
CREATE TABLE public.participation_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  date_created TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create reward boxes table
CREATE TABLE public.reward_boxes (
  id INTEGER PRIMARY KEY,
  reward VARCHAR(255) NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  is_opened BOOLEAN DEFAULT false,
  opened_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enabled BOOLEAN DEFAULT true,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create code usage tracking table
CREATE TABLE public.code_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  device_id VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(code, device_id)
);

-- Enable RLS on all tables
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for participants
CREATE POLICY "Users can view their own participant records" 
ON public.participants FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own participant records" 
ON public.participants FOR INSERT 
WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can update their own participant records" 
ON public.participants FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policies for participation codes (read-only for users)
CREATE POLICY "Anyone can view active participation codes" 
ON public.participation_codes FOR SELECT 
USING (is_active = true);

-- RLS Policies for reward boxes (read-only for users)
CREATE POLICY "Anyone can view reward boxes" 
ON public.reward_boxes FOR SELECT 
USING (true);

-- RLS Policies for notifications (read-only for users)
CREATE POLICY "Anyone can view notifications" 
ON public.notifications FOR SELECT 
USING (enabled = true);

-- RLS Policies for code usage
CREATE POLICY "Users can view their own code usage" 
ON public.code_usage FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own code usage" 
ON public.code_usage FOR INSERT 
WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- Insert default data
INSERT INTO public.participation_codes (code, is_active, date_created) VALUES
  ('THANKYOU2024', true, now()),
  ('REWARD100', true, now()),
  ('GIFT500', true, now()),
  ('BONUS2024', true, now()),
  ('WIN50K', true, now());

INSERT INTO public.reward_boxes (id, reward, amount, is_opened) VALUES
  (1, 'Reward 1', 50, false),
  (2, 'Reward 2', 100, false),
  (3, 'Reward 3', 150, false),
  (4, 'Reward 4', 200, false),
  (5, 'Reward 5', 250, false),
  (6, 'Reward 6', 500, false),
  (7, 'Reward 7', 750, false),
  (8, 'Reward 8', 1000, false),
  (9, 'Reward 9', 75, false),
  (10, 'Reward 10', 125, false),
  (11, 'Reward 11', 300, false),
  (12, 'Reward 12', 450, false);

INSERT INTO public.notifications (enabled, title, message) VALUES
  (true, 'Welcome to TheThankYou Rewards!', 'Enter your participation code to reveal your hidden reward. Each box contains a special prize just for you!');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_participants_updated_at
  BEFORE UPDATE ON public.participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_participation_codes_updated_at
  BEFORE UPDATE ON public.participation_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reward_boxes_updated_at
  BEFORE UPDATE ON public.reward_boxes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participation_codes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reward_boxes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.code_usage;