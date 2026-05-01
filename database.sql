--
-- PostgreSQL database dump
--

\restrict 3pAEOlrknpI3LP7bbfWMNiaLFevYrF2fPeHNlgRdzy8T8shiNLOi0Kx335xKtXE

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-05-02 04:48:40

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 16389)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5177 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 910 (class 1247 OID 16462)
-- Name: order_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.order_status AS ENUM (
    'pending',
    'confirmed',
    'shipping',
    'delivered',
    'cancelled',
    'disputed'
);


ALTER TYPE public.order_status OWNER TO postgres;

--
-- TOC entry 904 (class 1247 OID 16438)
-- Name: product_condition; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.product_condition AS ENUM (
    'like_new',
    '90_percent',
    '80_percent',
    '70_percent',
    'for_parts'
);


ALTER TYPE public.product_condition OWNER TO postgres;

--
-- TOC entry 907 (class 1247 OID 16450)
-- Name: product_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.product_status AS ENUM (
    'available',
    'reserved',
    'sold',
    'hidden',
    'deleted'
);


ALTER TYPE public.product_status OWNER TO postgres;

--
-- TOC entry 901 (class 1247 OID 16428)
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'buyer',
    'seller',
    'both',
    'admin'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- TOC entry 268 (class 1255 OID 16775)
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 16502)
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(110) NOT NULL,
    parent_id integer,
    icon_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16501)
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- TOC entry 5178 (class 0 OID 0)
-- Dependencies: 221
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- TOC entry 227 (class 1259 OID 16648)
-- Name: conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    buyer_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    product_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT conversations_buyer_not_seller CHECK ((buyer_id <> seller_id))
);


ALTER TABLE public.conversations OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16681)
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT messages_content_check CHECK ((length(TRIM(BOTH FROM content)) > 0))
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16622)
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    price_snapshot numeric(12,2) NOT NULL,
    quantity smallint DEFAULT 1 NOT NULL,
    CONSTRAINT order_items_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16586)
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    buyer_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    status public.order_status DEFAULT 'pending'::public.order_status NOT NULL,
    total_price numeric(14,2) NOT NULL,
    shipping_address text NOT NULL,
    shipping_fee numeric(10,2) DEFAULT 0 NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT orders_buyer_not_seller CHECK ((buyer_id <> seller_id)),
    CONSTRAINT orders_total_price_check CHECK ((total_price >= (0)::numeric))
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16711)
-- Name: product_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT product_comments_content_check CHECK ((length(TRIM(BOTH FROM content)) > 0))
);


ALTER TABLE public.product_comments OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16562)
-- Name: product_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    image_url text NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    sort_order smallint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.product_images OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16523)
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    seller_id uuid NOT NULL,
    category_id integer NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    price numeric(12,2) NOT NULL,
    condition public.product_condition NOT NULL,
    status public.product_status DEFAULT 'available'::public.product_status NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    location character varying(200),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT products_price_check CHECK ((price >= (0)::numeric))
);


ALTER TABLE public.products OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16740)
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    reviewee_id uuid NOT NULL,
    rating smallint NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16475)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(150) NOT NULL,
    phone character varying(20),
    avatar_url text,
    role public.user_role DEFAULT 'buyer'::public.user_role NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 4902 (class 2604 OID 16505)
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- TOC entry 5163 (class 0 OID 16502)
-- Dependencies: 222
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, slug, parent_id, icon_url, created_at) FROM stdin;
1	Điện tử	dien-tu	\N	\N	2026-04-29 15:13:49.845125+07
2	Thời trang	thoi-trang	\N	\N	2026-04-29 15:13:49.845125+07
3	Đồ gia dụng	do-gia-dung	\N	\N	2026-04-29 15:13:49.845125+07
4	Điện thoại	dien-thoai	1	\N	2026-04-29 15:13:49.845125+07
5	Laptop	laptop	1	\N	2026-04-29 15:13:49.845125+07
6	Máy ảnh	may-anh	1	\N	2026-04-29 15:13:49.845125+07
7	Áo	ao	2	\N	2026-04-29 15:13:49.845125+07
8	Giày dép	giay-dep	2	\N	2026-04-29 15:13:49.845125+07
\.


--
-- TOC entry 5168 (class 0 OID 16648)
-- Dependencies: 227
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conversations (id, buyer_id, seller_id, product_id, created_at) FROM stdin;
\.


--
-- TOC entry 5169 (class 0 OID 16681)
-- Dependencies: 228
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, conversation_id, sender_id, content, is_read, sent_at) FROM stdin;
\.


--
-- TOC entry 5167 (class 0 OID 16622)
-- Dependencies: 226
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, product_id, price_snapshot, quantity) FROM stdin;
da331f6a-fb85-49cf-b1e7-31a73226971c	d1a67800-e653-4c1b-9b19-67b9d330a54d	b0d0a7d1-9125-4dcc-8d6f-1a25ea0e0693	8500000.00	1
ab496bd1-571b-4c00-9493-f297fd271480	64aa724b-b88a-48f1-a3aa-39e9e81d18ae	2ab6be1a-1f3a-409c-b851-3f9dd0427c80	2200000.00	1
\.


--
-- TOC entry 5166 (class 0 OID 16586)
-- Dependencies: 225
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, buyer_id, seller_id, status, total_price, shipping_address, shipping_fee, note, created_at, updated_at) FROM stdin;
d1a67800-e653-4c1b-9b19-67b9d330a54d	9e563005-815b-4b7b-9955-2274f8f027b1	4841cccc-eff6-42bf-b06b-1f934ccade44	pending	8500000.00	1	0.00	SĐT: 1 - Thanh toán: COD	2026-05-02 03:45:53.915188+07	2026-05-02 03:45:53.915188+07
64aa724b-b88a-48f1-a3aa-39e9e81d18ae	9e563005-815b-4b7b-9955-2274f8f027b1	4841cccc-eff6-42bf-b06b-1f934ccade44	pending	2200000.00	1	0.00	SĐT: 1 - Thanh toán: COD	2026-05-02 04:00:24.053731+07	2026-05-02 04:00:24.053731+07
\.


--
-- TOC entry 5170 (class 0 OID 16711)
-- Dependencies: 229
-- Data for Name: product_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_comments (id, product_id, user_id, content, is_deleted, created_at) FROM stdin;
\.


--
-- TOC entry 5165 (class 0 OID 16562)
-- Dependencies: 224
-- Data for Name: product_images; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_images (id, product_id, image_url, is_primary, sort_order, created_at) FROM stdin;
c26c9250-99a6-4ff8-815b-68278358cb7f	d26ea3e5-af7f-4320-8b9c-d169ae732c13	https://file.hstatic.net/200000420363/file/cpu-amd-ryzen-5-7500f-1-1.jpg	t	0	2026-05-02 02:01:42.556467+07
1ab64c49-dd87-4e01-97fc-bacf4fdf23a2	0c4b3d1b-3e03-408c-9e0d-1f983a49306a	https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQYV97GlTo5NFN004V93hySRMDkH_IYiQqRPA&s	t	0	2026-05-02 02:13:18.260451+07
c5d51ad9-9dc5-43b1-8fd2-76cb95f41a26	b0d0a7d1-9125-4dcc-8d6f-1a25ea0e0693	https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-m58dgdp0o64j38	t	0	2026-05-02 02:35:10.430288+07
ba257ef8-85c2-4150-8be4-653a171f8117	2ab6be1a-1f3a-409c-b851-3f9dd0427c80	https://bida123.vn/wp-content/uploads/2024/03/Ngon-Co-White-Carbon-2.jpg	t	0	2026-05-02 02:37:55.469226+07
408683fb-6f0d-4a89-b3fb-b3fdc05012fc	c59e1a29-6819-44c8-b645-9e9e2da8566d	https://www.phongcachxanh.vn/cdn/shop/files/rawm-er21-pro-chu-t-gaming-cong-thai-h-c-sieu-nh-8k-1205303066.jpg?v=1763377643&width=1200	t	0	2026-05-02 02:40:47.847164+07
ba6b3a0f-1a15-4307-b969-91b6fc3c3c1c	e7af8922-deaa-4e63-9f0d-6b17adc203e3	https://mia.vn/media/uploads/tui-xach-du-lich-bigsize2-1621331070.jpg	t	0	2026-05-02 02:46:16.028219+07
b9abad62-ce9e-4046-8234-25615401c1fd	5b718856-dc39-4ec3-8907-3cea33f436ec	https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJyHHDnwgOnZ--shEw1Kdc-18DTefPNLXN6g&s	t	0	2026-05-02 04:01:41.334638+07
\.


--
-- TOC entry 5164 (class 0 OID 16523)
-- Dependencies: 223
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, seller_id, category_id, title, description, price, condition, status, view_count, location, created_at, updated_at) FROM stdin;
d26ea3e5-af7f-4320-8b9c-d169ae732c13	9e563005-815b-4b7b-9955-2274f8f027b1	1	CPU R5 7500f	\N	3200000.00	like_new	available	0	Chưa xác định	2026-05-02 02:01:42.556467+07	2026-05-02 02:01:42.556467+07
0c4b3d1b-3e03-408c-9e0d-1f983a49306a	4841cccc-eff6-42bf-b06b-1f934ccade44	1	Bàn phím cơ Dareu EK75 cũ	Dùng switch Dareu Dream gõ êm. Lưu ý bản này mạch hàn chết KHÔNG có hot-swap nha anh em. Ngoại hình xước dăm nhẹ.	350000.00	90_percent	available	0	Thủ Đức, TP.HCM	2026-04-30 04:04:03.640914+07	2026-05-02 03:07:53.052562+07
c59e1a29-6819-44c8-b645-9e9e2da8566d	4841cccc-eff6-42bf-b06b-1f934ccade44	1	Chuột gaming siêu nhẹ leo rank	Form đối xứng, clicky còn nảy. Feet zin hơi mòn, thích hợp cầm claw grip vẩy tâm cực chuẩn, form tay vừa và nhỏ.	800000.00	90_percent	available	0	Quận 9, TP.HCM	2026-04-30 04:04:03.640914+07	2026-05-02 03:07:53.052562+07
e7af8922-deaa-4e63-9f0d-6b17adc203e3	4841cccc-eff6-42bf-b06b-1f934ccade44	1	Túi xách du lịch cỡ lớn	Đã sử dụng vài lần. Vải canvas chống nước tốt, nhiều ngăn tiện lợi, khóa kéo mượt mà.	150000.00	80_percent	available	0	Tân Bình, TP.HCM	2026-04-30 04:04:03.640914+07	2026-05-02 03:07:53.052562+07
b0d0a7d1-9125-4dcc-8d6f-1a25ea0e0693	4841cccc-eff6-42bf-b06b-1f934ccade44	1	CPU Ryzen 9 hàng lướt	Nâng cấp máy nên dư. Đã test chạy Curve Optimizer siêu mát mẻ, hiệu năng đỉnh cao, chân cắm thẳng tắp không cong móp.	8500000.00	like_new	sold	0	Dĩ An, Bình Dương	2026-04-30 04:04:03.640914+07	2026-05-02 03:45:53.915188+07
2ab6be1a-1f3a-409c-b851-3f9dd0427c80	4841cccc-eff6-42bf-b06b-1f934ccade44	1	Ngọn cơ bida White Carbon lỗ 9 bóng	Lên đời ngọn xịn hơn nên pass lại. Chống bạt cực tốt, hỗ trợ trôi cắm rất lực và êm. Ngoại hình còn mới nguyên.	2200000.00	like_new	sold	0	Quận 1, TP.HCM	2026-04-30 04:04:03.640914+07	2026-05-02 04:00:24.053731+07
5b718856-dc39-4ec3-8907-3cea33f436ec	9e563005-815b-4b7b-9955-2274f8f027b1	1	Pad chuột fps bám tay	\N	120000.00	like_new	available	0	Chưa xác định	2026-05-02 04:01:41.334638+07	2026-05-02 04:01:41.334638+07
\.


--
-- TOC entry 5171 (class 0 OID 16740)
-- Dependencies: 230
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, order_id, reviewer_id, reviewee_id, rating, comment, created_at) FROM stdin;
\.


--
-- TOC entry 5161 (class 0 OID 16475)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, full_name, phone, avatar_url, role, is_verified, is_active, created_at, updated_at) FROM stdin;
4841cccc-eff6-42bf-b06b-1f934ccade44	khachhang@gmail.com	12345	khachhang	\N	\N	buyer	f	t	2026-04-30 04:02:57.560864+07	2026-04-30 04:02:57.560864+07
0eb8ea57-08d9-4f17-b084-a03a9151adc7	minh.uth@gmail.com	$2b$10$EPztzgvZNbJzot7WFRUev.uAeUvJQ.d29CIpCkaUjUVKFYtJEY9LS	Hoàng Trần Quang Minh	\N	\N	buyer	f	t	2026-04-30 16:41:42.203814+07	2026-04-30 16:41:42.203814+07
f36c4056-ff61-4b18-ab6e-19942969b012	minh.uth1uth1@gmail.com	$2b$10$fnllqpJX/c/bf9tOh0jkSuDbXdk.xJMjZcsIhHGP2MJT.wHs7KTXK	Hoàng Trần Quang Minh	\N	\N	buyer	f	t	2026-04-30 16:43:39.308784+07	2026-04-30 16:43:39.308784+07
9e563005-815b-4b7b-9955-2274f8f027b1	tranquangminh7562@gmail.com	$2b$10$olpfILuqL8ItrkEGYEXwwuR4Btb.pHWeGOn0hHFyhVQyKp4.ZRQee	minh	\N	\N	buyer	f	t	2026-05-01 10:57:33.27921+07	2026-05-01 10:57:33.27921+07
\.


--
-- TOC entry 5179 (class 0 OID 0)
-- Dependencies: 221
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 8, true);


--
-- TOC entry 4945 (class 2606 OID 16514)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 4947 (class 2606 OID 16516)
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- TOC entry 4972 (class 2606 OID 16662)
-- Name: conversations conversations_buyer_id_seller_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_buyer_id_seller_id_product_id_key UNIQUE (buyer_id, seller_id, product_id);


--
-- TOC entry 4974 (class 2606 OID 16660)
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- TOC entry 4982 (class 2606 OID 16697)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- TOC entry 4970 (class 2606 OID 16634)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4965 (class 2606 OID 16608)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 4986 (class 2606 OID 16727)
-- Name: product_comments product_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_comments
    ADD CONSTRAINT product_comments_pkey PRIMARY KEY (id);


--
-- TOC entry 4960 (class 2606 OID 16578)
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--
-- TOC entry 4956 (class 2606 OID 16545)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 4990 (class 2606 OID 16757)
-- Name: reviews reviews_order_id_reviewer_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_order_id_reviewer_id_key UNIQUE (order_id, reviewer_id);


--
-- TOC entry 4992 (class 2606 OID 16755)
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 4941 (class 2606 OID 16498)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4943 (class 2606 OID 16496)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4948 (class 1259 OID 16522)
-- Name: idx_categories_parent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_categories_parent ON public.categories USING btree (parent_id);


--
-- TOC entry 4983 (class 1259 OID 16738)
-- Name: idx_comments_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comments_product ON public.product_comments USING btree (product_id);


--
-- TOC entry 4984 (class 1259 OID 16739)
-- Name: idx_comments_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comments_user ON public.product_comments USING btree (user_id);


--
-- TOC entry 4975 (class 1259 OID 16678)
-- Name: idx_conversations_buyer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conversations_buyer ON public.conversations USING btree (buyer_id);


--
-- TOC entry 4976 (class 1259 OID 16680)
-- Name: idx_conversations_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conversations_product ON public.conversations USING btree (product_id);


--
-- TOC entry 4977 (class 1259 OID 16679)
-- Name: idx_conversations_seller; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conversations_seller ON public.conversations USING btree (seller_id);


--
-- TOC entry 4978 (class 1259 OID 16708)
-- Name: idx_messages_conversation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_conversation ON public.messages USING btree (conversation_id);


--
-- TOC entry 4979 (class 1259 OID 16709)
-- Name: idx_messages_sender; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_sender ON public.messages USING btree (sender_id);


--
-- TOC entry 4980 (class 1259 OID 16710)
-- Name: idx_messages_sent_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_sent_at ON public.messages USING btree (sent_at DESC);


--
-- TOC entry 4957 (class 1259 OID 16585)
-- Name: idx_one_primary_image; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_one_primary_image ON public.product_images USING btree (product_id) WHERE (is_primary = true);


--
-- TOC entry 4966 (class 1259 OID 16645)
-- Name: idx_order_items_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);


--
-- TOC entry 4967 (class 1259 OID 16646)
-- Name: idx_order_items_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_product ON public.order_items USING btree (product_id);


--
-- TOC entry 4968 (class 1259 OID 16647)
-- Name: idx_order_items_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_order_items_unique ON public.order_items USING btree (order_id, product_id);


--
-- TOC entry 4961 (class 1259 OID 16619)
-- Name: idx_orders_buyer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_buyer ON public.orders USING btree (buyer_id);


--
-- TOC entry 4962 (class 1259 OID 16620)
-- Name: idx_orders_seller; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_seller ON public.orders USING btree (seller_id);


--
-- TOC entry 4963 (class 1259 OID 16621)
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- TOC entry 4958 (class 1259 OID 16584)
-- Name: idx_product_images_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_images_product ON public.product_images USING btree (product_id);


--
-- TOC entry 4949 (class 1259 OID 16557)
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_category ON public.products USING btree (category_id);


--
-- TOC entry 4950 (class 1259 OID 16560)
-- Name: idx_products_condition; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_condition ON public.products USING btree (condition);


--
-- TOC entry 4951 (class 1259 OID 16561)
-- Name: idx_products_fts; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_fts ON public.products USING gin (to_tsvector('simple'::regconfig, (((title)::text || ' '::text) || COALESCE(description, ''::text))));


--
-- TOC entry 4952 (class 1259 OID 16559)
-- Name: idx_products_price; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_price ON public.products USING btree (price);


--
-- TOC entry 4953 (class 1259 OID 16556)
-- Name: idx_products_seller; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_seller ON public.products USING btree (seller_id);


--
-- TOC entry 4954 (class 1259 OID 16558)
-- Name: idx_products_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_status ON public.products USING btree (status);


--
-- TOC entry 4987 (class 1259 OID 16774)
-- Name: idx_reviews_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_order ON public.reviews USING btree (order_id);


--
-- TOC entry 4988 (class 1259 OID 16773)
-- Name: idx_reviews_reviewee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_reviewee ON public.reviews USING btree (reviewee_id);


--
-- TOC entry 4938 (class 1259 OID 16499)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 4939 (class 1259 OID 16500)
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- TOC entry 5013 (class 2620 OID 16778)
-- Name: orders trg_orders_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- TOC entry 5012 (class 2620 OID 16777)
-- Name: products trg_products_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- TOC entry 5011 (class 2620 OID 16776)
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- TOC entry 4993 (class 2606 OID 16517)
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- TOC entry 5001 (class 2606 OID 16663)
-- Name: conversations conversations_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5002 (class 2606 OID 16673)
-- Name: conversations conversations_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 5003 (class 2606 OID 16668)
-- Name: conversations conversations_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5004 (class 2606 OID 16698)
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- TOC entry 5005 (class 2606 OID 16703)
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4999 (class 2606 OID 16635)
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 5000 (class 2606 OID 16640)
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- TOC entry 4997 (class 2606 OID 16609)
-- Name: orders orders_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 4998 (class 2606 OID 16614)
-- Name: orders orders_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 5006 (class 2606 OID 16728)
-- Name: product_comments product_comments_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_comments
    ADD CONSTRAINT product_comments_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 5007 (class 2606 OID 16733)
-- Name: product_comments product_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_comments
    ADD CONSTRAINT product_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4996 (class 2606 OID 16579)
-- Name: product_images product_images_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 4994 (class 2606 OID 16551)
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT;


--
-- TOC entry 4995 (class 2606 OID 16546)
-- Name: products products_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5008 (class 2606 OID 16758)
-- Name: reviews reviews_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE RESTRICT;


--
-- TOC entry 5009 (class 2606 OID 16768)
-- Name: reviews reviews_reviewee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_reviewee_id_fkey FOREIGN KEY (reviewee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5010 (class 2606 OID 16763)
-- Name: reviews reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2026-05-02 04:48:41

--
-- PostgreSQL database dump complete
--

\unrestrict 3pAEOlrknpI3LP7bbfWMNiaLFevYrF2fPeHNlgRdzy8T8shiNLOi0Kx335xKtXE

